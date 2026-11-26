import React,{useEffect,useMemo,useState} from "react";
import {supabase} from "../../supabase/supabaseClient";
import {useCompany} from "../../context/CompanyContext";
import "./AccountingCategorization.css";

export default function AccountingCategorization({module}) {
 const {currentCompanyId}=useCompany();
 const isPurchase=module==="Purchase", isSales=module==="Sales";
 const [parties,setParties]=useState([]),[ledgers,setLedgers]=useState([]),[invoices,setInvoices]=useState([]),[partyId,setPartyId]=useState(""),[ledgerId,setLedgerId]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const partyTable=isPurchase?"vendors":"customers",partyName=isPurchase?"vendor_name":"customer_name";
 const invoiceTable=isPurchase?"purchase_invoices":"sales_invoices",partyField=isPurchase?"vendor_id":"customer_id",ledgerField=isPurchase?"purchase_ledger_id":"sales_ledger_id";
 const defaultField=isPurchase?"default_purchase_ledger_id":"default_sales_ledger_id";
 useEffect(()=>{if(!currentCompanyId)return;
  Promise.all([
   supabase.from(partyTable).select("id,"+partyName+",ledger_id,"+defaultField).eq("company_id",currentCompanyId).order(partyName),
   supabase.from("chart_of_accounts").select("id,ledger_name,ledger_code").eq("company_id",currentCompanyId).eq("is_active",true).order("ledger_name"),
   supabase.from(invoiceTable).select("id,invoice_no,"+partyField+","+ledgerField+",accounting_classification_status,accounting_voucher_id").eq("company_id",currentCompanyId).eq("is_deleted",false)
  ]).then(([p,l,i])=>{setParties(p.data||[]);setLedgers(l.data||[]);setInvoices(i.data||[]);if(p.error||l.error||i.error)setMsg((p.error||l.error||i.error).message);});
 },[currentCompanyId,module]);
 const uncategorized=invoices.filter(i=>!i[ledgerField]&&!i.accounting_voucher_id);
 const partyCounts=useMemo(()=>Object.fromEntries(parties.map(p=>[p.id,uncategorized.filter(i=>i[partyField]===p.id).length])),[parties,invoices,partyField]);
 const count=partyId?partyCounts[partyId]||0:uncategorized.length;
 const apply=async()=>{
  if(!partyId||!ledgerId||!currentCompanyId){setMsg("Select a party and ledger.");return;}
  const party=parties.find(p=>p.id===partyId), ledger=ledgers.find(l=>l.id===ledgerId);
  if(!party||!ledger)return;
  const target=partyId?uncategorized.filter(i=>i[partyField]===partyId):uncategorized;
  if(!target.length){setMsg("No uncategorized invoices for this party.");return;}
  setBusy(true);setMsg("");
  try{
   const {error:masterError}=await supabase.from(partyTable).update({[defaultField]:ledgerId}).eq("company_id",currentCompanyId).eq("id",partyId);if(masterError)throw masterError;
   const {error:invoiceError}=await supabase.from(invoiceTable).update({[ledgerField]:ledgerId,accounting_classification_status:"Categorized"}).eq("company_id",currentCompanyId).in("id",target.map(i=>i.id)).is("accounting_voucher_id",null);if(invoiceError)throw invoiceError;
   setInvoices(old=>old.map(i=>target.some(t=>t.id===i.id)?{...i,[ledgerField]:ledgerId,accounting_classification_status:"Categorized"}:i));
   setParties(old=>old.map(p=>p.id===partyId?{...p,[defaultField]:ledgerId}:p));
   setMsg("Mapped "+target.length+" invoices for "+party[partyName]+" to "+ledger.ledger_name+". This mapping is saved as the default for future transactions.");
  }catch(e){setMsg("Mapping failed: "+e.message);}finally{setBusy(false);}
 };
 if(!isPurchase&&!isSales)return null;
 return <section className="ac-categorize">
  <div className="ac-head"><div><h3>{module} Accounting Categorization</h3><p>Map one supplier/customer and apply the ledger to its uncategorized invoices. This mapping will be reused for future invoices.</p></div><span className="ac-count">{uncategorized.length} uncategorized</span></div>
  <div className="ac-controls"><label>{isPurchase?"Supplier":"Customer"}<select value={partyId} onChange={e=>{setPartyId(e.target.value);setMsg("");}}><option value="">Choose party</option>{parties.map(p=><option key={p.id} value={p.id}>{p[partyName]} · {partyCounts[p.id]||0} pending</option>)}</select></label><label>Debit/Credit Ledger<select value={ledgerId} onChange={e=>setLedgerId(e.target.value)}><option value="">Choose ledger</option>{ledgers.map(l=><option key={l.id} value={l.id}>{l.ledger_name}{l.ledger_code?" · "+l.ledger_code:""}</option>)}</select></label><button disabled={busy||!partyId||!ledgerId||count===0} onClick={apply}>{busy?"Saving…":"Apply mapping to "+count+" invoices"}</button></div>
  {msg&&<p className="ac-message">{msg}</p>}
  <div className="ac-footnote">{isPurchase?"The supplier's payable ledger is separate. This selects the purchase/expense/inventory debit account; GST and supplier payable posting will be handled by voucher posting.":"The customer's receivable ledger is separate. This selects the sales income credit account; GST and customer receivable posting will be handled by voucher posting."}</div>
 </section>;
}
