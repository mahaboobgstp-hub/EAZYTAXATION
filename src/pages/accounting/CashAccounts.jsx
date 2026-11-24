import React,{useEffect,useState} from "react";
import {useCompany} from "../../context/CompanyContext";
import {supabase} from "../../supabase/supabaseClient";
import {getMasterAccountingSetup,mainGroupsForMaster,childGroupsForMaster} from "../../services/masterAccountingService";
import "../../css/accounting/CashAccounts.css";

export default function CashAccounts(){
 const {currentCompanyId,currentCompany}=useCompany();
 const [rows,setRows]=useState([]);
 const [setup,setSetup]=useState({enabled:false,groups:[],ledgers:[]});
 const [name,setName]=useState("");
 const [mainId,setMainId]=useState("");
 const [intermediateId,setIntermediateId]=useState("");
 const [subgroupId,setSubgroupId]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const cashPattern=/(cash|petty cash)/i;
 useEffect(()=>{if(!currentCompanyId){setRows([]);setSetup({enabled:false,groups:[],ledgers:[]});return;}load();getMasterAccountingSetup(currentCompanyId).then(setSetup).catch(e=>setError(e.message));},[currentCompanyId]);
 const load=async()=>{const {data,error}=await supabase.from("cash_account_profiles").select("*").eq("company_id",currentCompanyId).order("cash_name");if(error)throw error;setRows(data||[]);};
 const mainGroups=mainGroupsForMaster(setup,"Asset").filter(g=>cashPattern.test(g.group_name)||childGroupsForMaster(setup,g.id).some(child=>cashPattern.test(child.group_name)||childGroupsForMaster(setup,child.id).some(sub=>cashPattern.test(sub.group_name))));
 const intermediateGroups=childGroupsForMaster(setup,mainId).filter(g=>cashPattern.test(g.group_name)||childGroupsForMaster(setup,g.id).some(sub=>cashPattern.test(sub.group_name)));
 const subgroups=childGroupsForMaster(setup,intermediateId).filter(g=>cashPattern.test(g.group_name));
 const finalGroupId=subgroupId||intermediateId||mainId;
 const save=async e=>{e.preventDefault();if(!currentCompanyId||!name.trim())return;setBusy(true);setError("");setNotice("");try{const {data:existing,error:dupError}=await supabase.from("cash_account_profiles").select("id,cash_name").eq("company_id",currentCompanyId).ilike("cash_name",name.trim()).limit(1);if(dupError)throw dupError;if(existing?.length)throw new Error("A cash account with this name already exists.");
 if(setup.enabled&&mainGroups.length&&(!mainId||(intermediateGroups.length&&!intermediateId)))throw new Error("Select the cash account group.");
 let ledgerId=null;
 if(setup.enabled&&finalGroupId){const group=setup.groups.find(g=>g.id===finalGroupId);if(!group||group.account_nature!=="Asset"||!cashPattern.test(group.group_name))throw new Error("Select a Cash or Petty Cash account group.");const code="CASH"+Date.now().toString().slice(-7);const {data:ledger,error:ledgerError}=await supabase.from("chart_of_accounts").insert({company_id:currentCompanyId,ledger_name:"Cash - "+name.trim(),ledger_code:code,group_id:finalGroupId,parent_ledger_id:null,ledger_level:"Main Ledger",is_posting_enabled:true,opening_balance:0,opening_balance_type:"Debit",gst_applicable:false,is_system:false,is_active:true,description:"Automatically linked to Cash Account Master"}).select("id").single();if(ledgerError)throw ledgerError;ledgerId=ledger.id;}
 const {error:saveError}=await supabase.from("cash_account_profiles").insert({company_id:currentCompanyId,cash_name:name.trim(),cash_code:null,ledger_id:ledgerId,is_active:true});if(saveError)throw saveError;
 setName("");setMainId("");setIntermediateId("");setSubgroupId("");setNotice("Cash account saved"+(ledgerId?" with its accounting ledger.":" without accounting linkage."));await load();
 }catch(e){setError(e.message);}finally{setBusy(false);}};
 const ledgerName=id=>setup.ledgers.find(l=>l.id===id)?.ledger_name||"";
 return <main className="syd-cash-accounts"><header><h1>Cash Account Master</h1><p>Manage separate cash counters or petty-cash accounts. Accounting ledgers are created only for Accounting-enabled companies with a valid account group.</p><strong>{currentCompany?.company_name||"Selected company"}</strong></header>{error&&<div className="cash-account-error">{error}</div>}{notice&&<div className="cash-account-notice">{notice}</div>}<form onSubmit={save}><label>Cash Account Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Main Cash, Petty Cash, Branch Cash" required/></label>{setup.enabled&&<section className="cash-account-classification"><h3>Accounting Classification</h3><label>Main Group<select value={mainId} onChange={e=>{setMainId(e.target.value);setIntermediateId("");setSubgroupId("");}}><option value="">Select main group</option>{mainGroups.map(g=><option key={g.id} value={g.id}>{g.group_name}</option>)}</select></label><label>Intermediate Group<select value={intermediateId} disabled={!mainId} onChange={e=>{setIntermediateId(e.target.value);setSubgroupId("");}}><option value="">Select intermediate group</option>{intermediateGroups.map(g=><option key={g.id} value={g.id}>{g.group_name}</option>)}</select></label><label>Subgroup (optional)<select value={subgroupId} disabled={!intermediateId} onChange={e=>setSubgroupId(e.target.value)}><option value="">Use intermediate group</option>{subgroups.map(g=><option key={g.id} value={g.id}>{g.group_name}</option>)}</select></label><small>SYD creates the cash ledger in the final selected group.</small></section>}<button disabled={busy}>{busy?"Saving...":"Save Cash Account"}</button></form><section className="cash-account-list"><h2>Cash Accounts</h2><table><thead><tr><th>Account</th><th>Ledger</th><th>Status</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.cash_name}</td><td>{ledgerName(row.ledger_id)||"Not linked"}</td><td>{row.is_active?"Active":"Inactive"}</td></tr>)}</tbody></table></section></main>;
}
