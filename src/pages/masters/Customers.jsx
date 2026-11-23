import React,{useEffect,useState} from "react";
import BulkTransactionImport from "../../components/BulkTransactionImport";
import PartyMasterForm from "../../components/PartyMasterForm";
import {useCompany} from "../../context/CompanyContext";
import {createCustomer,getCustomers} from "../../services/customerService";
import "../../css/masters/Customers.css";
function Customers(){const {currentCompanyId}=useCompany();const [customers,setCustomers]=useState([]);const [showForm,setShowForm]=useState(false);
useEffect(()=>{if(currentCompanyId)loadCustomers();else setCustomers([]);},[currentCompanyId]);
const loadCustomers=async()=>{try{setCustomers(await getCustomers(currentCompanyId)||[]);}catch(e){console.error(e);}};
const save=async data=>{try{if(!currentCompanyId){alert("Please select a Current Company.");return;}await createCustomer(data,currentCompanyId);alert("Customer saved successfully.");setShowForm(false);loadCustomers();}catch(e){alert(e.message);}};
return <div className="customers-page"><h2>Customers Master</h2><BulkTransactionImport kind="customers"/>{showForm?<PartyMasterForm kind="customer" onSave={save} onCancel={()=>setShowForm(false)}/>:<button className="party-add-button" onClick={()=>setShowForm(true)}>+ Add Customer</button>}<div className="party-table-wrap"><table className="customer-grid"><thead><tr><th>Customer</th><th>GSTIN</th><th>PAN</th><th>Mobile</th><th>Email</th><th>State</th><th>Status</th></tr></thead><tbody>{customers.length?customers.map(c=><tr key={c.id}><td>{c.customer_name}</td><td>{c.gstin}</td><td>{c.pan}</td><td>{c.mobile}</td><td>{c.email}</td><td>{c.billing_state||c.state}</td><td>{c.is_active===false?"Inactive":"Active"}</td></tr>):<tr><td colSpan="7">No customers found</td></tr>}</tbody></table></div></div>}
export default Customers;