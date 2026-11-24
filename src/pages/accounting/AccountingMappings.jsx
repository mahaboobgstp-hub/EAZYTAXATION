import React,{useEffect,useState} from "react";
import {useCompany} from "../../context/CompanyContext";
import {getSYDAccountingMappings,saveSYDAccountingMapping,SYD_ACCOUNTING_MAPPING_OPTIONS} from "../../services/sydAccountingMappingsService";
import "../../css/accounting/AccountingMappings.css";

export default function AccountingMappings(){
 const {currentCompanyId,currentCompany}=useCompany();
 const [setup,setSetup]=useState({enabled:false,ledgers:[],mappings:{}});
 const [values,setValues]=useState({});
 const [busyKey,setBusyKey]=useState("");
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{if(!currentCompanyId){setSetup({enabled:false,ledgers:[],mappings:{}});setValues({});return;}load();},[currentCompanyId]);
 const load=async()=>{try{const result=await getSYDAccountingMappings(currentCompanyId);setSetup(result);setValues(result.mappings||{});}catch(e){setError(e.message);}};
 const save=async key=>{const ledgerId=values[key];if(!ledgerId){setError("Select a ledger before saving.");return;}setBusyKey(key);setError("");setNotice("");try{await saveSYDAccountingMapping(currentCompanyId,key,ledgerId);setNotice("Mapping saved.");}catch(e){setError(e.message);}finally{setBusyKey("");}};
 const groups=[...new Set(SYD_ACCOUNTING_MAPPING_OPTIONS.map(x=>x.group))];
 return <main className="syd-accounting-mappings"><header><h1>Automatic Accounting Mappings</h1><p>Configure company-level ledger defaults once. SYD uses these mappings when transaction-specific mappings are not available.</p><strong>{currentCompany?.company_name||"Selected company"}</strong></header>{error&&<div className="syd-map-error">{error}</div>}{notice&&<div className="syd-map-notice">{notice}</div>}
 {!setup.enabled?<section className="syd-map-disabled"><h2>Accounting setup is unavailable</h2><p>These settings are available only when Accounting is enabled and a Chart of Accounts exists for the selected company. Billing-only companies will not create or modify accounting records.</p></section>:groups.map(group=><section className="syd-map-section" key={group}><h2>{group}</h2>{SYD_ACCOUNTING_MAPPING_OPTIONS.filter(o=>o.group===group).map(option=><article className="syd-map-row" key={option.key}><div><strong>{option.label}</strong><p>{option.description}</p></div><select value={values[option.key]||""} onChange={e=>setValues(prev=>({...prev,[option.key]:e.target.value}))}><option value="">Not mapped</option>{setup.ledgers.filter(l=>!option.nature||setup.groups.find(g=>g.id===l.group_id)?.account_nature===option.nature).map(l=><option key={l.id} value={l.id}>{l.ledger_name}{l.ledger_code?" ("+l.ledger_code+")":""}</option>)}</select><button type="button" disabled={busyKey===option.key||!values[option.key]} onClick={()=>save(option.key)}>{busyKey===option.key?"Saving...":"Save"}</button></article>)}</section>)}
 </main>;
}
