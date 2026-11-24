import {supabase} from "../supabase/supabaseClient";
import {createVoucher,postVoucher} from "./accountingService";

const money=value=>Math.round((Number(value)||0)*100)/100;
const sum=(rows,key)=>money(rows.reduce((total,row)=>total+Number(row[key]||0),0));
const stockTypes=["Inventory","Raw Material","Consumables","Finished Goods","Trading Goods"];
const taxMapping={
 sales:{cgst:"output_cgst_ledger",sgst:"output_sgst_ledger",igst:"output_igst_ledger",cess:"output_cess_ledger",additionalCess:"output_additional_cess_ledger"},
 purchase:{cgst:"input_cgst_ledger",sgst:"input_sgst_ledger",igst:"input_igst_ledger",cess:"input_cess_ledger"}
};

export async function getCompanyAccountingCapability(companyId){
 if(!companyId)return {enabled:false,reason:"No company selected"};
 const {data:company,error}=await supabase.from("companies").select("accounting_enabled").eq("id",companyId).single();
 if(error)throw error;
 if(!company?.accounting_enabled)return {enabled:false,reason:"Accounting is not enabled for this company"};
 const {count,error:ledgerError}=await supabase.from("chart_of_accounts").select("id",{count:"exact",head:true}).eq("company_id",companyId);
 if(ledgerError)throw ledgerError;
 if(!count)return {enabled:false,reason:"Chart of Accounts is not configured"};
 return {enabled:true};
}

async function getMappings(companyId){
 const {data,error}=await supabase.from("syd_accounting_mappings").select("mapping_key,ledger_id").eq("company_id",companyId);
 if(error)throw error;
 return Object.fromEntries((data||[]).map(row=>[row.mapping_key,row.ledger_id]));
}
async function setSourceStatus(table,companyId,sourceId,status,message,voucherId=null){
 const {error}=await supabase.from(table).update({accounting_status:status,accounting_message:message||null,accounting_voucher_id:voucherId}).eq("company_id",companyId).eq("id",sourceId);
 if(error)throw error;
}
async function pending(table,companyId,id,reason,status="Pending Mapping"){
 await setSourceStatus(table,companyId,id,status,reason,null);
 return {status,reason};
}
function addAmountLine(lines,ledgerId,amount,side,narration){
 const value=money(amount);if(!value)return;
 if(!ledgerId)throw new Error("A ledger mapping is missing for "+narration+".");
 lines.push({ledger_id:ledgerId,debit:side==="debit"?value:0,credit:side==="credit"?value:0,line_narration:narration});
}
function addTaxLines(lines,mappings,taxValues,side,kind){
 const map=taxMapping[kind];
 for(const tax of ["cgst","sgst","igst","cess","additionalCess"]){
  const amount=money(taxValues[tax]);
  if(!amount)continue;
  const key=map[tax];
  addAmountLine(lines,mappings[key],amount,side,tax.toUpperCase()+" "+kind.toUpperCase());
 }
}

/**
 * Central posting gateway. Operational modules provide fully mapped lines;
 * this service never guesses an account. Source uniqueness makes retries idempotent.
 */
export async function postBusinessTransaction(companyId,transaction){
 const capability=await getCompanyAccountingCapability(companyId);
 if(!capability.enabled)return {status:"skipped",reason:capability.reason};
 if(!transaction?.source_module||!transaction?.source_record_id)throw new Error("Source module and source record ID are required.");
 const lines=(transaction.lines||[]).map(line=>({ledger_id:line.ledger_id,debit:money(line.debit),credit:money(line.credit),line_narration:line.line_narration||transaction.narration||null}));
 if(lines.length<2)throw new Error("Auto-posting requires at least two mapped accounting lines.");
 const debit=sum(lines,"debit"),credit=sum(lines,"credit");
 if(debit<=0||Math.abs(debit-credit)>0.005)throw new Error("Automatic accounting lines must balance.");
 if(lines.some(line=>!line.ledger_id||line.debit<0||line.credit<0||(line.debit>0&&line.credit>0)||(line.debit===0&&line.credit===0)))throw new Error("Invalid accounting line.");
 const {data:ledgers,error:ledgerError}=await supabase.from("chart_of_accounts").select("id,is_active,is_posting_enabled").eq("company_id",companyId).in("id",lines.map(x=>x.ledger_id));
 if(ledgerError)throw ledgerError;
 const ledgerMap=new Map((ledgers||[]).map(x=>[x.id,x]));
 if(lines.some(line=>{const ledger=ledgerMap.get(line.ledger_id);return !ledger||ledger.is_active===false||ledger.is_posting_enabled===false;}))throw new Error("One or more mapped ledgers are inactive, missing, or not posting-enabled.");
 const existingQuery=()=>supabase.from("accounting_vouchers").select("*").eq("company_id",companyId).eq("source_module",transaction.source_module).eq("source_record_id",transaction.source_record_id).neq("status","Reversed").limit(1);
 let {data:existing,error:existingError}=await existingQuery();if(existingError)throw existingError;
 if(existing?.length){if(existing[0].status==="Posted")return {status:"already_posted",voucher_id:existing[0].id,voucher:existing[0]};if(existing[0].status==="Draft"){const {data:draftLines,error:draftError}=await supabase.from("accounting_voucher_lines").select("ledger_id,debit,credit").eq("company_id",companyId).eq("voucher_id",existing[0].id);if(draftError)throw draftError;const draftSorted=(draftLines||[]).slice().sort((a,b)=>String(a.ledger_id).localeCompare(String(b.ledger_id)));const expectedSorted=lines.slice().sort((a,b)=>String(a.ledger_id).localeCompare(String(b.ledger_id)));const draftMatches=draftSorted.length===expectedSorted.length&&draftSorted.every((line,i)=>line.ledger_id===expectedSorted[i].ledger_id&&Math.abs(Number(line.debit||0)-expectedSorted[i].debit)<0.005&&Math.abs(Number(line.credit||0)-expectedSorted[i].credit)<0.005);if(!draftMatches)throw new Error("A draft accounting voucher already exists for this source but its lines differ. It was not auto-posted.");const posted=await postVoucher(companyId,existing[0].id);return {status:"posted",voucher_id:existing[0].id,voucher:posted};}}
 const voucherNumber=transaction.voucher_number||("AUTO-"+transaction.source_module.toUpperCase()+"-"+String(transaction.source_record_id).slice(0,8));
 try{
  const voucher=await createVoucher(companyId,{voucher_number:voucherNumber,voucher_type:transaction.voucher_type||"Journal",voucher_date:transaction.voucher_date,reference_number:transaction.reference_number||null,narration:transaction.narration||null,source_module:transaction.source_module,source_record_id:transaction.source_record_id,status:"Draft"},lines);
  const posted=await postVoucher(companyId,voucher.id);
  return {status:"posted",voucher_id:voucher.id,voucher:posted};
 }catch(error){
  const retry=await existingQuery();if(retry.error)throw error;
  if(retry.data?.[0]?.status==="Posted")return {status:"already_posted",voucher_id:retry.data[0].id,voucher:retry.data[0]};
  throw error;
 }
}

export async function autoPostSalesInvoice(companyId,invoiceId){
 try{
  const capability=await getCompanyAccountingCapability(companyId);
  if(!capability.enabled)return await pending("sales_invoices",companyId,invoiceId,capability.reason,"Not Applicable");
  const {data:invoice,error}=await supabase.from("sales_invoices").select("*").eq("company_id",companyId).eq("id",invoiceId).single();if(error)throw error;
  const {data:items,error:itemError}=await supabase.from("sales_invoice_items").select("item_id,item_name,amount,qty").eq("invoice_id",invoiceId).order("line_no");if(itemError)throw itemError;
  const mappings=await getMappings(companyId);
  let debitLedger=null;
  if(invoice.sale_type==="CASH")debitLedger=mappings.cash_ledger;
  else{
   if(!invoice.customer_id)return await pending("sales_invoices",companyId,invoiceId,"Customer is not selected; invoice is not automatically posted.");
   const {data:customer,error:customerError}=await supabase.from("customers").select("ledger_id").eq("company_id",companyId).eq("id",invoice.customer_id).single();if(customerError)throw customerError;
   debitLedger=customer.ledger_id;if(!debitLedger)return await pending("sales_invoices",companyId,invoiceId,"Customer has no linked receivable ledger.");
  }
  if(invoice.sale_type==="CASH"&&!debitLedger)return await pending("sales_invoices",companyId,invoiceId,"Default cash ledger mapping is missing.");
  const ids=[...new Set((items||[]).map(i=>i.item_id).filter(Boolean))];
  let itemMap={};
  if(ids.length){const {data:masterItems,error:itemsError}=await supabase.from("items").select("id,item_type,accounting_item_type,sales_ledger_id").eq("company_id",companyId).in("id",ids);if(itemsError)throw itemsError;itemMap=Object.fromEntries((masterItems||[]).map(i=>[i.id,i]));}
  const incomeLedger=mappings.default_sales_ledger;
  const lines=[],revenueByLedger={};
  for(const line of items||[]){
   const item=line.item_id?itemMap[line.item_id]:null;
   if(item?.item_type==="Goods"&&(!item.accounting_item_type||stockTypes.includes(item.accounting_item_type)))return await pending("sales_invoices",companyId,invoiceId,"Inventory sale requires verified cost-of-goods and stock valuation posting; it was not auto-posted.");
   const ledger=item?.sales_ledger_id||incomeLedger;if(!ledger)return await pending("sales_invoices",companyId,invoiceId,"Sales ledger mapping is missing for "+line.item_name+".");
   const value=money(line.amount);revenueByLedger[ledger]=money((revenueByLedger[ledger]||0)+value);
  }
  const taxable=money(invoice.taxable_value);if(Math.abs(sum(items||[],"amount")-taxable)>0.05)return await pending("sales_invoices",companyId,invoiceId,"Invoice line totals do not match the header taxable value.");
  Object.entries(revenueByLedger).forEach(([ledger,amount])=>addAmountLine(lines,ledger,amount,"credit","Sales Revenue"));
  const taxes={cgst:invoice.cgst,sgst:invoice.sgst,igst:invoice.igst,cess:invoice.cess_amount,additionalCess:invoice.additional_cess_amount};
  for(const [tax,key] of Object.entries(taxMapping.sales)){if(money(taxes[tax])&&!mappings[key])return await pending("sales_invoices",companyId,invoiceId,"Missing "+tax.toUpperCase()+" output tax ledger mapping.");}
  if(money(invoice.other_amount)&&!mappings.other_charges_ledger)return await pending("sales_invoices",companyId,invoiceId,"Other Charges ledger mapping is missing.");
  const roundOff=money(invoice.round_off);if(roundOff&&!mappings.round_off_ledger)return await pending("sales_invoices",companyId,invoiceId,"Round-off ledger mapping is missing.");
  addTaxLines(lines,mappings,taxes,"credit","sales");
  addAmountLine(lines,mappings.other_charges_ledger,invoice.other_amount,"credit","Other Charges");
  if(roundOff)addAmountLine(lines,mappings.round_off_ledger,Math.abs(roundOff),roundOff>0?"credit":"debit","Sales Round-off");
  const invoiceTotal=money(invoice.total_amount);
  if(Math.abs(sum(lines,"credit")-sum(lines,"debit")-invoiceTotal)>0.05)return await pending("sales_invoices",companyId,invoiceId,"Mapped accounting lines do not equal the invoice total; review mappings and invoice adjustments.");
  addAmountLine(lines,debitLedger,invoiceTotal,"debit",invoice.sale_type==="CASH"?"Cash Sale":"Customer Receivable");
  const result=await postBusinessTransaction(companyId,{source_module:"sales_invoice",source_record_id:invoiceId,voucher_type:"Sales",voucher_date:invoice.invoice_date,voucher_number:"AUTO-SI-"+String(invoice.invoice_no||invoiceId).replace(/[^A-Z0-9]/gi,"").slice(-10),reference_number:invoice.invoice_no,narration:"Auto-posted Sales Invoice "+invoice.invoice_no,lines});
  await setSourceStatus("sales_invoices",companyId,invoiceId,"Posted","Automatically posted to accounting.",result.voucher_id);
  return result;
 }catch(error){const {data:existing}=await supabase.from("accounting_vouchers").select("id").eq("company_id",companyId).eq("source_module","sales_invoice").eq("source_record_id",invoiceId).neq("status","Reversed").maybeSingle();await setSourceStatus("sales_invoices",companyId,invoiceId,"Failed",error.message,existing?.id||null);return {status:"Failed",reason:error.message};}
}

export async function autoPostPurchaseInvoice(companyId,invoiceId){
 try{
  const capability=await getCompanyAccountingCapability(companyId);
  if(!capability.enabled)return await pending("purchase_invoices",companyId,invoiceId,capability.reason,"Not Applicable");
  const {data:invoice,error}=await supabase.from("purchase_invoices").select("*").eq("company_id",companyId).eq("id",invoiceId).single();if(error)throw error;
  const {data:items,error:itemError}=await supabase.from("purchase_invoice_items").select("item_id,item_name,taxable_value,line_total").eq("invoice_id",invoiceId).order("line_no");if(itemError)throw itemError;
  if(!invoice.vendor_id)return await pending("purchase_invoices",companyId,invoiceId,"Supplier is not selected; invoice is not automatically posted.");
  const {data:vendor,error:vendorError}=await supabase.from("vendors").select("ledger_id").eq("company_id",companyId).eq("id",invoice.vendor_id).single();if(vendorError)throw vendorError;
  if(!vendor.ledger_id)return await pending("purchase_invoices",companyId,invoiceId,"Supplier has no linked payable ledger.");
  const ids=[...new Set((items||[]).map(i=>i.item_id).filter(Boolean))];let itemMap={};
  if(ids.length){const {data:masterItems,error:itemsError}=await supabase.from("items").select("id,item_type,accounting_item_type,purchase_ledger_id,inventory_ledger_id").eq("company_id",companyId).in("id",ids);if(itemsError)throw itemsError;itemMap=Object.fromEntries((masterItems||[]).map(i=>[i.id,i]));}
  const mappings=await getMappings(companyId),purchaseByLedger={};
  for(const line of items||[]){
   const item=line.item_id?itemMap[line.item_id]:null;
   if(item?.item_type==="Goods"&&!item.accounting_item_type)return await pending("purchase_invoices",companyId,invoiceId,"Goods item classification is missing.");
   const isStock=item&&stockTypes.includes(item.accounting_item_type);
   const ledger=isStock?(item.inventory_ledger_id||mappings.inventory_ledger):(item?.purchase_ledger_id||mappings.default_purchase_ledger);
   if(!ledger)return await pending("purchase_invoices",companyId,invoiceId,"Purchase or inventory ledger mapping is missing for "+line.item_name+".");
   const value=money(line.taxable_value);purchaseByLedger[ledger]=money((purchaseByLedger[ledger]||0)+value);
  }
  const taxable=money(invoice.taxable);if(Math.abs(sum(items||[],"taxable_value")-taxable)>0.05)return await pending("purchase_invoices",companyId,invoiceId,"Invoice line totals do not match the header taxable value.");
  const lines=[];Object.entries(purchaseByLedger).forEach(([ledger,amount])=>addAmountLine(lines,ledger,amount,"debit","Purchase / Inventory"));
  const taxes={cgst:invoice.cgst,sgst:invoice.sgst,igst:invoice.igst,cess:0,additionalCess:0};for(const [tax,key] of Object.entries(taxMapping.purchase)){if(money(taxes[tax])&&!mappings[key])return await pending("purchase_invoices",companyId,invoiceId,"Missing input "+tax.toUpperCase()+" ledger mapping.");}addTaxLines(lines,mappings,taxes,"debit","purchase");
  const roundOff=money(invoice.round_off);if(roundOff&&!mappings.round_off_ledger)return await pending("purchase_invoices",companyId,invoiceId,"Round-off ledger mapping is missing.");if(roundOff)addAmountLine(lines,mappings.round_off_ledger,Math.abs(roundOff),roundOff>0?"debit":"credit","Purchase Round-off");
  const total=money(invoice.grand_total);addAmountLine(lines,vendor.ledger_id,total,"credit","Supplier Payable");
  if(Math.abs(sum(lines,"debit")-sum(lines,"credit"))>0.05)return await pending("purchase_invoices",companyId,invoiceId,"Mapped accounting lines do not equal the purchase invoice total; review mappings.");
  const result=await postBusinessTransaction(companyId,{source_module:"purchase_invoice",source_record_id:invoiceId,voucher_type:"Purchase",voucher_date:invoice.invoice_date,voucher_number:"AUTO-PI-"+String(invoice.invoice_no||invoiceId).replace(/[^A-Z0-9]/gi,"").slice(-10),reference_number:invoice.supplier_invoice_no||invoice.invoice_no,narration:"Auto-posted Purchase Invoice "+invoice.invoice_no,lines});
  await setSourceStatus("purchase_invoices",companyId,invoiceId,"Posted","Automatically posted to accounting.",result.voucher_id);return result;
 }catch(error){const {data:existing}=await supabase.from("accounting_vouchers").select("id").eq("company_id",companyId).eq("source_module","purchase_invoice").eq("source_record_id",invoiceId).neq("status","Reversed").maybeSingle();await setSourceStatus("purchase_invoices",companyId,invoiceId,"Failed",error.message,existing?.id||null);return {status:"Failed",reason:error.message};}
}

export async function autoPostExpense(companyId,expenseId){
 try{
  const capability=await getCompanyAccountingCapability(companyId);
  if(!capability.enabled)return await pending("expenses",companyId,expenseId,capability.reason,"Not Applicable");
  const {data:expense,error}=await supabase.from("expenses").select("*").eq("company_id",companyId).eq("id",expenseId).single();if(error)throw error;
  const mappings=await getMappings(companyId);
  let categoryLedger=null;
  if(expense.category_id){const {data:category,error:categoryError}=await supabase.from("expense_categories").select("ledger_id,company_id").eq("id",expense.category_id).or("company_id.eq."+companyId+",company_id.is.null").maybeSingle();if(categoryError)throw categoryError;categoryLedger=category?.company_id===companyId?category.ledger_id:null;}
  const expenseLedger=categoryLedger||mappings.default_expense_ledger;
  if(!expenseLedger)return await pending("expenses",companyId,expenseId,"Expense category ledger or default expense ledger is not mapped.");
  let payableLedger=mappings.default_expense_payable_ledger;
  if(expense.vendor_id){const {data:vendor,error:vendorError}=await supabase.from("vendors").select("ledger_id").eq("company_id",companyId).eq("id",expense.vendor_id).single();if(vendorError)throw vendorError;payableLedger=vendor.ledger_id||payableLedger;}
  if(!payableLedger)return await pending("expenses",companyId,expenseId,"Supplier payable or default expense payable ledger is not mapped.");
  const taxes={cgst:expense.cgst,sgst:expense.sgst,igst:expense.igst,cess:0,additionalCess:0};
  for(const [tax,key] of Object.entries(taxMapping.purchase)){if(money(taxes[tax])&&!mappings[key])return await pending("expenses",companyId,expenseId,"Missing input "+tax.toUpperCase()+" ledger mapping.");
  }
  const lines=[];
  addAmountLine(lines,expenseLedger,expense.taxable_amount,"debit","Expense");
  addTaxLines(lines,mappings,taxes,"debit","purchase");
  addAmountLine(lines,expenseLedger,expense.other_charges,"debit","Other Charges");
  const roundOff=money(expense.round_off);
  if(roundOff&&!mappings.round_off_ledger)return await pending("expenses",companyId,expenseId,"Round-off ledger mapping is missing.");
  if(roundOff)addAmountLine(lines,mappings.round_off_ledger,Math.abs(roundOff),roundOff>0?"debit":"credit","Expense Round-off");
  addAmountLine(lines,payableLedger,expense.total_amount,"credit","Expense Payable");
  if(Math.abs(sum(lines,"debit")-sum(lines,"credit"))>0.05)return await pending("expenses",companyId,expenseId,"Expense accounting lines do not equal the expense total.");
  const result=await postBusinessTransaction(companyId,{source_module:"expense",source_record_id:expenseId,voucher_type:"Journal",voucher_date:expense.expense_date,voucher_number:"AUTO-EXP-"+String(expense.expense_no||expenseId).replace(/[^A-Z0-9]/gi,"").slice(-10),reference_number:expense.reference_no,narration:"Auto-posted Expense "+expense.expense_no,lines});
  await setSourceStatus("expenses",companyId,expenseId,"Posted","Automatically posted to accounting.",result.voucher_id);return result;
 }catch(error){const {data:existing}=await supabase.from("accounting_vouchers").select("id").eq("company_id",companyId).eq("source_module","expense").eq("source_record_id",expenseId).neq("status","Reversed").maybeSingle();await setSourceStatus("expenses",companyId,expenseId,"Failed",error.message,existing?.id||null);return {status:"Failed",reason:error.message};}
}

export async function autoPostExpensePayment(companyId,paymentId){
 try{
  const capability=await getCompanyAccountingCapability(companyId);
  if(!capability.enabled)return await pending("expense_payments",companyId,paymentId,capability.reason,"Not Applicable");
  const {data:payment,error}=await supabase.from("expense_payments").select("*").eq("company_id",companyId).eq("id",paymentId).single();if(error)throw error;
  if(payment.status!=="Completed")return await pending("expense_payments",companyId,paymentId,"Payment is not completed; accounting posting was not created.","Not Applicable");
  const mappings=await getMappings(companyId);
  let payableLedger=mappings.default_expense_payable_ledger;
  if(payment.vendor_id){const {data:vendor,error:vendorError}=await supabase.from("vendors").select("ledger_id").eq("company_id",companyId).eq("id",payment.vendor_id).single();if(vendorError)throw vendorError;payableLedger=vendor.ledger_id||payableLedger;}
  if(!payableLedger)return await pending("expense_payments",companyId,paymentId,"Supplier payable or expense payable ledger mapping is missing.");
  let paymentLedger=payment.payment_method==="Cash"?mappings.cash_ledger:mappings.bank_ledger;
  if(payment.payment_method!=="Cash"&&payment.account_name){
   const {data:bank,error:bankError}=await supabase.from("bank_account_profiles").select("ledger_id,bank_name,account_number_masked").eq("company_id",companyId).eq("is_active",true).eq("bank_name",payment.account_name).maybeSingle();
   if(bankError)throw bankError;if(bank?.ledger_id)paymentLedger=bank.ledger_id;
  }
  if(!paymentLedger)return await pending("expense_payments",companyId,paymentId,"Cash or bank payment ledger mapping is missing.");
  const amount=money(payment.amount);if(amount<=0)return await pending("expense_payments",companyId,paymentId,"Payment amount must be greater than zero.");
  const lines=[{ledger_id:payableLedger,debit:amount,credit:0,line_narration:"Expense Payment / Payable Settlement"},{ledger_id:paymentLedger,debit:0,credit:amount,line_narration:"Cash / Bank Payment"}];
  const result=await postBusinessTransaction(companyId,{source_module:"expense_payment",source_record_id:paymentId,voucher_type:"Payment",voucher_date:payment.payment_date,voucher_number:"AUTO-PAY-"+String(payment.payment_no||paymentId).replace(/[^A-Z0-9]/gi,"").slice(-10),reference_number:payment.reference_no,narration:"Auto-posted Expense Payment "+payment.payment_no,lines});
  await setSourceStatus("expense_payments",companyId,paymentId,"Posted","Automatically posted to accounting.",result.voucher_id);return result;
 }catch(error){const {data:existing}=await supabase.from("accounting_vouchers").select("id").eq("company_id",companyId).eq("source_module","expense_payment").eq("source_record_id",paymentId).neq("status","Reversed").maybeSingle();await setSourceStatus("expense_payments",companyId,paymentId,"Failed",error.message,existing?.id||null);return {status:"Failed",reason:error.message};}
}
