import {supabase} from "../supabase/supabaseClient";

const n=v=>Math.round((Number(v)||0)*100)/100;
const findLedger=async(companyId,patterns)=>{
 const {data,error}=await supabase.from("chart_of_accounts").select("id,ledger_name").eq("company_id",companyId).eq("is_active",true);
 if(error)throw error;
 for(const pattern of patterns){const found=(data||[]).find(l=>pattern.test(l.ledger_name));if(found)return found;}
 return null;
};
const requiredLedger=async(companyId,patterns,label)=>{
 const l=await findLedger(companyId,patterns);
 if(!l)throw new Error("Missing "+label+" ledger in Chart of Accounts. Create/map it before posting.");
 return l;
};
const postVoucher=async({companyId,module,sourceId,type,date,ref,narration,lines})=>{
 const debit=n(lines.reduce((s,l)=>s+n(n(l.debit)),0);
 const credit=n(lines.reduce((s,l)=>s+n(n(l.credit),0));
 if(lines.length<2||Math.abs(debit-credit)>0.01)throw new Error("Posting rejected: voucher is not balanced.");
 const {data,error}=await supabase.rpc("post_accounting_source_voucher",{p_company_id:companyId,p_source_module:module,p_source_record_id:sourceId,p_voucher_type:type,p_voucher_date:date,p_reference_number:ref||null,p_narration:narration,p_lines:lines});
 if(error)throw error;
 return data;
};
export async function postPurchaseInvoice(companyId,invoice){
 if(!companyId||!invoice?.id)throw new Error("Company and purchase invoice are required.");
 if(invoice.accounting_voucher_id)return invoice.accounting_voucher_id;
 if(!invoice.purchase_ledger_id)throw new Error("Categorize the purchase invoice before posting.");
 const {data:vendor,error:ve}=await supabase.from("vendors").select("ledger_id,vendor_name").eq("company_id",companyId).eq("id",invoice.vendor_id).single();if(ve)throw ve;
 if(!vendor.ledger_id)throw new Error("Supplier has no linked payable ledger.");
 const lines=[{ledger_id:invoice.purchase_ledger_id,debit:n(invoice.taxable),credit:0,narration:"Purchase taxable value"}];
 const gstRows=[["cgst",[/input.*cgst/i,/cgst.*input/i,/central.*input.*tax/i]],["sgst",[/input.*sgst/i,/sgst.*input/i,/state.*input.*tax/i]],["igst",[/input.*igst/i,/igst.*input/i,/integrated.*input.*tax/i]]];
 for(const [taxKey,patterns] of gstRows){const amount=n(invoice[taxKey]);if(amount>0){const ledger=await requiredLedger(companyId,patterns[0],"Input "+taxKey.toUpperCase());lines.push({ledger_id:ledger.id,debit:amount,credit:0,narration:"Input GST "+taxKey.toUpperCase()});}}
 lines.push({ledger_id:vendor.ledger_id,debit:0,credit:n(invoice.grand_total),narration:"Supplier payable - "+vendor.vendor_name});
 const voucherId=await postVoucher({companyId,module:"Purchase",sourceId:invoice.id,type:"Purchase",date:invoice.invoice_date,ref:invoice.supplier_invoice_no||invoice.invoice_no,narration:"Purchase "+(invoice.invoice_no||"")+" - "+vendor.vendor_name,lines});
 const {error:updateError}=await supabase.from("purchase_invoices").update({accounting_status:"Posted",accounting_voucher_id:voucherId,accounting_message:null}).eq("company_id",companyId).eq("id",invoice.id);if(updateError)throw updateError;
 return voucherId;
}
export async function postSalesInvoice(companyId,invoice){
 if(!companyId||!invoice?.id)throw new Error("Company and sales invoice are required.");
 if(invoice.accounting_voucher_id)return invoice.accounting_voucher_id;
 if(!invoice.sales_ledger_id)throw new Error("Categorize the sales invoice before posting.");
 const {data:customer,error:ce}=await supabase.from("customers").select("ledger_id,customer_name").eq("company_id",companyId).eq("id",invoice.customer_id).single();if(ce)throw ce;
 if(!customer.ledger_id)throw new Error("Customer has no linked receivable ledger.");
 const lines=[{ledger_id:customer.ledger_id,debit:n(invoice.total_amount),credit:0,narration:"Customer receivable"}];
 for(const [taxKey,patterns] of [["cgst",[/output.*cgst/i,/cgst.*output/i,/central.*output.*tax/i]],["sgst",[/output.*sgst/i,/sgst.*output/i,/state.*output.*tax/i]],["igst",[/output.*igst/i,/igst.*output/i,/integrated.*output.*tax/i]]]){
  const amount=n(invoice[taxKey]);if(amount>0){const ledger=await requiredLedger(companyId,patterns,"Output "+taxKey.toUpperCase());lines.push({ledger_id:ledger.id,debit:0,credit:amount,narration:"Output GST "+taxKey.toUpperCase()});}
 }
 lines.push({ledger_id:invoice.sales_ledger_id,debit:0,credit:n(invoice.taxable_value),narration:"Sales income"});
 const voucherId=await postVoucher({companyId,module:"Sales",sourceId:invoice.id,type:"Sales",date:invoice.invoice_date,ref:invoice.invoice_no,narration:"Sales "+(invoice.invoice_no||"")+" - "+customer.customer_name,lines});
 const {error:updateError}=await supabase.from("sales_invoices").update({accounting_status:"Posted",accounting_voucher_id:voucherId,accounting_message:null}).eq("company_id",companyId).eq("id",invoice.id);if(updateError)throw updateError;
 return voucherId;
}
export async function postBankStatementLine(companyId,line){
 if(!companyId||!line?.id)throw new Error("Company and bank transaction are required.");
 if(line.matched_voucher_id)return line.matched_voucher_id;
 if(!line.ledger_id)throw new Error("Categorize the bank transaction to a counterpart ledger first.");
 const {data:account,error:ae}=await supabase.from("bank_account_profiles").select("ledger_id,bank_name").eq("company_id",companyId).eq("id",line.bank_account_id).single();if(ae)throw ae;
 if(!account.ledger_id)throw new Error("Bank account has no linked ledger.");
 const amount=n(line.amount),isCredit=line.direction==="Credit";
 const lines=isCredit?[{ledger_id:account.ledger_id,debit:amount,credit:0,narration:"Bank receipt"},{ledger_id:line.ledger_id,debit:0,credit:amount,narration:line.narration||"Bank receipt counterpart"}]: [{ledger_id:line.ledger_id,debit:amount,credit:0,narration:line.narration||"Bank payment counterpart"},{ledger_id:account.ledger_id,debit:0,credit:amount,narration:"Bank payment"}];
 const voucherId=await postVoucher({companyId,module:"Bank",sourceId:line.id,type:isCredit?"Receipt":"Payment",date:line.statement_date,ref:line.reference_number,narration:line.narration,lines});
 const {error:updateError}=await supabase.from("bank_statement_lines").update({matched_voucher_id:voucherId,match_status:"Matched",matched_at:new Date().toISOString(),classification_status:"Posted"}).eq("company_id",companyId).eq("id",line.id);if(updateError)throw updateError;
 return voucherId;
}
