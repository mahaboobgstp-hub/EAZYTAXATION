/**
 * Stage 8 — deterministic transaction context analysis.
 * Confidence is a transparent heuristic score, not a model probability.
 * Questions are generated from missing/ambiguous fields and dependencies.
 */
const SCREEN_RULES = {
  sales_invoice:{label:"Sales Invoice",master:"customers",masterName:["customer_name","customer"],requiredHeaders:["invoice_date"],lineKeys:["items","lines"],lineRequired:["item_name","qty","rate"],lineMaster:true},
  purchase_invoice:{label:"Purchase Invoice",master:"vendors",masterName:["vendor_name","supplier_name"],requiredHeaders:["invoice_date","supplier_invoice_no"],lineKeys:["lines","items"],lineRequired:["item_name","qty","rate"],lineMaster:true},
  expense_entry:{label:"Expense Entry",master:"vendors",masterName:["payee_name","vendor_name"],requiredHeaders:["expense_date"],lineKeys:["lines","items"],lineRequired:["description","qty","rate"],categoryRequired:true},
};
const valueById=(fields,id)=>fields.find(f=>f?.field_id===id)?.value;
const present=v=>v!==undefined&&v!==null&&String(v).trim()!=="";
const numeric=v=>present(v)&&Number.isFinite(Number(v));
export function analyzeSYDTransactionContext({plan,companyId,selectedMasters={},selectedLineItems={},corrections={}}={}) {
  const screenId=plan?.screen_id, rule=SCREEN_RULES[screenId];
  if(!rule)return {supported:false,score:0,level:"Needs clarification",reasons:["Transaction screen is not supported by the context analyzer."],questions:["Which transaction screen should this be prepared for?"]};
  const fields=Array.isArray(plan?.fields)?plan.fields:[];
  const headers={};
  fields.forEach(f=>{if(f?.field_id)headers[f.field_id]=f.value;});
  Object.assign(headers,corrections.headers||{});
  const linesValue=rule.lineKeys.map(k=>headers[k]).find(Array.isArray)||[];
  const lines=linesValue.map((line,i)=>({...line,...(corrections.lines?.[i]||{})}));
  const questions=[], reasons=[];
  let score=35;
  if(present(screenId)){score+=15;reasons.push("Transaction type identified");}
  if(companyId){score+=10;reasons.push("Company context available");}else questions.push("Which company should this transaction belong to?");
  const master=selectedMasters[rule.master];
  const proposedMasterName=rule.masterName.map(k=>headers[k]).find(present);
  if(master?.id){score+=15;reasons.push("Party master explicitly verified");}
  else if(proposedMasterName){score+=7;questions.push(`Please confirm the ${rule.master==="customers"?"customer":"supplier/payee"} “${proposedMasterName}” against the live master list.`);}
  else questions.push(`Which ${rule.master==="customers"?"customer":"supplier/payee"} is involved?`);
  if(rule.categoryRequired){if(selectedMasters.expense_categories?.id){score+=10;reasons.push("Expense category verified");}else questions.push("Which expense category should be used?");}
  const date=headers[screenId==="expense_entry"?"expense_date":"invoice_date"];
  if(present(date)){score+=8;reasons.push("Transaction date supplied");}else questions.push("What is the transaction date?");
  if(screenId==="purchase_invoice"&&present(headers.supplier_invoice_no)){score+=5;reasons.push("Supplier invoice number supplied");}else if(screenId==="purchase_invoice")questions.push("What is the supplier's invoice number?");
  if(lines.length){score+=10;reasons.push(`${lines.length} transaction line(s) detected`);}
  const companyState=plan?.company_context?.state||plan?.company_state||plan?.company?.state||null;
  const partyState=headers.vendor_state||headers.shipping_state||headers.place_of_supply||null;
  if(companyState&&partyState){score+=4;reasons.push("GST state context available");if(String(companyState).toLowerCase()===String(partyState).toLowerCase())reasons.push("Likely intra-state supply (state values match)");else reasons.push("Likely inter-state supply (state values differ)");}
  else if(["sales_invoice","purchase_invoice"].includes(screenId))questions.push("Confirm place of supply/state so GST type (CGST+SGST or IGST) can be checked.");
  if(screenId==="purchase_invoice"&&present(headers.supplier_invoice_date)&&present(headers.invoice_date)){const billDate=Date.parse(headers.supplier_invoice_date),entryDate=Date.parse(headers.invoice_date);if(!Number.isNaN(billDate)&&!Number.isNaN(entryDate)&&billDate>entryDate)questions.push("Supplier bill date is later than voucher date. Confirm both dates.");
  }
  if(present(headers.gstin)&&present(headers.vendor_name)&&!selectedMasters.vendors?.id)questions.push("Supplier name and GSTIN are both present but no verified supplier master is selected. Confirm they belong together.");
  if(present(headers.tax_inclusive)&&!lines.some(line=>present(line.rate)))questions.push("Tax-inclusive pricing is indicated; confirm line rates before computing tax.");
  if(present(headers.discount_type)&&present(headers.discount_value)&&!numeric(headers.discount_value))questions.push("Invoice discount value is not numeric; correct it before draft validation.");
if(!lines.length) questions.push("What items or expense details should be entered?");
  lines.forEach((line,i)=>{
    const label=`Line ${i+1}`;
    if(rule.lineMaster&&selectedLineItems[i]?.id){score+=3;reasons.push(`${label} item master matched`);}
    else if(rule.lineMaster&&!present(line.item_name))questions.push(`${label}: what item is this?`);
    if(numeric(line.qty)&&Number(line.qty)>0){score+=2;}else questions.push(`${label}: confirm quantity.`);
    if(numeric(line.rate)&&Number(line.rate)>=0){score+=2;}else questions.push(`${label}: confirm rate/amount.`);
    const tax=line.gst_rate??line.gst_percent;
    if(present(tax)&&numeric(tax)){score+=1;}else questions.push(`${label}: confirm GST rate or tax treatment.`);
  });
  const seen=new Set();
  const uniqueQuestions=questions.filter(q=>{if(seen.has(q))return false;seen.add(q);return true;});
  const bounded=Math.max(0,Math.min(100,score));
  const level=bounded>=85?"High":bounded>=65?"Moderate":"Low";
  if(uniqueQuestions.length)reasons.push(`${uniqueQuestions.length} clarification(s) remain`);
  return {supported:true,screenId,score:bounded,level,questions:uniqueQuestions,reasons,dependencyStatus:{company:!!companyId,partyMaster:!!master?.id,expenseCategory:!!selectedMasters.expense_categories?.id,lines:lines.length,lineMasterMatches:Object.keys(selectedLineItems).length},clarificationsNeeded:uniqueQuestions.length,analyzedAt:new Date().toISOString()};
}
