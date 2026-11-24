import React,{useEffect,useState} from "react";
import BulkTransactionImport from "../../components/BulkTransactionImport";
import PartyMasterForm from "../../components/PartyMasterForm";
import {useCompany} from "../../context/CompanyContext";
import {createVendor,getVendors,updateVendor,deleteVendor} from "../../services/vendorService";
import {getMasterAccountingSetup} from "../../services/masterAccountingService";
import "../../css/masters/Vendors.css";
function Vendors(){
 const {currentCompanyId}=useCompany();
 const [vendors,setVendors]=useState([]);
 const [editing,setEditing]=useState(null);
 const [showForm,setShowForm]=useState(false);
 const [accountingSetup,setAccountingSetup]=useState({enabled:false,ledgers:[],groups:[]});
 useEffect(()=>{if(currentCompanyId){loadVendors();getMasterAccountingSetup(currentCompanyId).then(setAccountingSetup).catch(e=>console.warn("Accounting master setup:",e.message));}else{setVendors([]);setAccountingSetup({enabled:false,ledgers:[],groups:[]});}},[currentCompanyId]);
 const loadVendors=async()=>{try{setVendors(await getVendors(currentCompanyId)||[]);}catch(e){console.error(e);}};
 const save=async data=>{try{if(!currentCompanyId){alert("Please select a Current Company.");return;}if(editing){await updateVendor(editing.id,data,currentCompanyId);alert("Vendor updated successfully.");}else{await createVendor(data,currentCompanyId);alert("Vendor saved successfully.");}setEditing(null);setShowForm(false);loadVendors();}catch(e){alert(e.message);}};
 const edit=v=>{setEditing(v);setShowForm(true);};
 const remove=async id=>{if(!window.confirm("Delete this vendor?"))return;try{await deleteVendor(id,currentCompanyId);loadVendors();}catch(e){alert(e.message);}};
 return <div className="vendors-page"><h2>Vendors Master</h2><BulkTransactionImport kind="vendors" onImported={loadVendors}/>{showForm?<PartyMasterForm key={editing?.id||"new-vendor"} kind="vendor" initialData={editing} accountingSetup={accountingSetup} onSave={save} onCancel={()=>{setShowForm(false);setEditing(null);}}/>:<button className="party-add-button" onClick={()=>{setEditing(null);setShowForm(true);}}>+ Add Vendor</button>}<div className="party-table-wrap"><table className="vendor-grid"><thead><tr><th>Vendor</th><th>Ledger No.</th><th>GSTIN</th><th>PAN</th><th>Mobile</th><th>Email</th><th>State</th><th>Status</th><th>Actions</th></tr></thead><tbody>{vendors.length?vendors.map(v=><tr key={v.id}><td>{v.vendor_name}</td><td>{v.ledger_code||'—'}</td><td>{v.gstin}</td><td>{v.pan}</td><td>{v.mobile}</td><td>{v.email}</td><td>{v.billing_state||v.state}</td><td>{v.is_active===false?"Inactive":"Active"}</td><td><button type="button" onClick={()=>edit(v)}>Edit</button><button type="button" onClick={()=>remove(v.id)}>Delete</button></td></tr>):<tr><td colSpan="9">No vendors found</td></tr>}</tbody></table></div></div>;
}
export default Vendors;
