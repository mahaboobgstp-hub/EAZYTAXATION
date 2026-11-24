import React,{useEffect,useMemo,useState} from "react";
import BulkTransactionImport from "../../components/BulkTransactionImport";
import {useCompany} from "../../context/CompanyContext";
import UomDropdown from "../../components/dropdowns/UomDropdown";
import GstRateDropdown from "../../components/dropdowns/GstRateDropdown";
import {createItem,getItems,deleteItem,updateItem} from "../../services/itemService";
import {getMasterAccountingSetup} from "../../services/masterAccountingService";
import "../../css/masters/Items.css";

const blankItem={item_code:"",item_name:"",item_type:"Service",accounting_item_type:"",hsn_sac:"",unit:"",gst_rate:18,sales_rate:"",purchase_rate:"",inventory_ledger_id:"",purchase_ledger_id:"",sales_ledger_id:"",cogs_ledger_id:"",consumption_ledger_id:""};
const inventoryTypes=["Inventory","Raw Material","Consumables","Finished Goods","Trading Goods","Non-stock","Service"];
function Items(){
 const {currentCompanyId}=useCompany();
 const [items,setItems]=useState([]);
 const [editingId,setEditingId]=useState(null);
 const [formData,setFormData]=useState(blankItem);
 const [setup,setSetup]=useState({enabled:false,ledgers:[],groups:[]});
 const [mainLedgerId,setMainLedgerId]=useState("");
 const [intermediateLedgerId,setIntermediateLedgerId]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!currentCompanyId){setItems([]);setSetup({enabled:false,ledgers:[],groups:[]});return;}loadItems();getMasterAccountingSetup(currentCompanyId).then(setSetup).catch(e=>console.warn("Accounting item setup:",e.message));},[currentCompanyId]);
 const loadItems=async()=>{if(!currentCompanyId)return;try{setItems(await getItems(currentCompanyId)||[]);}catch(e){console.error(e);}};
 const mainLedgers=useMemo(()=>setup.ledgers.filter(l=>l.ledger_level==="Main Ledger"&&l.is_active!==false),[setup]);
 const intermediateLedgers=useMemo(()=>setup.ledgers.filter(l=>l.ledger_level==="Intermediate Ledger"&&l.is_active!==false&&l.parent_ledger_id===mainLedgerId),[setup,mainLedgerId]);
 const postingLedgers=useMemo(()=>setup.ledgers.filter(l=>l.ledger_level==="Subledger"&&l.is_active!==false&&l.is_posting_enabled!==false&&l.parent_ledger_id===intermediateLedgerId),[setup,intermediateLedgerId]);
 const handleChange=e=>setFormData(prev=>({...prev,[e.target.name]:e.target.value}));
 const reset=()=>{setFormData(blankItem);setEditingId(null);setMainLedgerId("");setIntermediateLedgerId("");};
 const handleEdit=item=>{setEditingId(item.id);setFormData({...blankItem,...item});const linked=setup.ledgers.find(l=>l.id===item.inventory_ledger_id);const intermediate=linked?setup.ledgers.find(l=>l.id===linked.parent_ledger_id):null;const main=intermediate?setup.ledgers.find(l=>l.id===intermediate.parent_ledger_id):null;setMainLedgerId(main?.id||"");setIntermediateLedgerId(intermediate?.id||"");};
 const handleDelete=async id=>{if(!window.confirm("Are you sure you want to delete this item?"))return;try{await deleteItem(id,currentCompanyId);alert("Item deleted successfully.");loadItems();}catch(e){alert(e.message);}};
 const handleSubmit=async e=>{e.preventDefault();if(!currentCompanyId){alert("Please select a Current Company.");return;}if(setup.enabled&&["Inventory","Raw Material","Consumables","Finished Goods","Trading Goods"].includes(formData.accounting_item_type)&&!formData.inventory_ledger_id){alert("Select the accounting hierarchy and inventory posting ledger for this item.");return;}setBusy(true);try{const payload={...formData,inventory_ledger_id:formData.inventory_ledger_id||null};if(editingId)await updateItem(editingId,payload,currentCompanyId);else await createItem(payload,currentCompanyId);alert(editingId?"Item updated successfully":"Item saved successfully");reset();await loadItems();}catch(e){alert(e.message);}finally{setBusy(false);}};
 return <div className="items-page"><h2>Items Master</h2><BulkTransactionImport kind="items"/>
 <form className="item-form" onSubmit={handleSubmit}>
 <input name="item_code" placeholder="Item Code" value={formData.item_code||""} onChange={handleChange}/>
 <input name="item_name" placeholder="Item Name" value={formData.item_name||""} onChange={handleChange} required/>
 <select name="item_type" value={formData.item_type||"Service"} onChange={handleChange}><option value="Service">Service</option><option value="Goods">Goods</option></select>
 <input name="hsn_sac" placeholder="HSN / SAC" value={formData.hsn_sac||""} onChange={handleChange}/>
 <UomDropdown name="unit" value={formData.unit||""} onChange={handleChange}/>
 <GstRateDropdown name="gst_rate" value={formData.gst_rate??18} onChange={handleChange}/>
 <input name="sales_rate" placeholder="Sales Rate" value={formData.sales_rate??""} onChange={handleChange}/>
 <input name="purchase_rate" placeholder="Purchase Rate" value={formData.purchase_rate??""} onChange={handleChange}/>
 {setup.enabled&&<section className="item-accounting-classification"><h3>Accounting & Inventory Classification</h3><label>Item Classification<select name="accounting_item_type" value={formData.accounting_item_type||""} onChange={handleChange}><option value="">Select classification</option>{inventoryTypes.map(t=><option key={t}>{t}</option>)}</select></label><label>Main Ledger / Group<select value={mainLedgerId} onChange={e=>{setMainLedgerId(e.target.value);setIntermediateLedgerId("");setFormData(prev=>({...prev,inventory_ledger_id:""}));}}><option value="">Select main ledger</option>{mainLedgers.map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</select></label><label>Intermediate Group<select value={intermediateLedgerId} disabled={!mainLedgerId} onChange={e=>{setIntermediateLedgerId(e.target.value);setFormData(prev=>({...prev,inventory_ledger_id:""}));}}><option value="">Select intermediate ledger</option>{intermediateLedgers.map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</select></label><label>Inventory Posting Ledger<select name="inventory_ledger_id" value={formData.inventory_ledger_id||""} disabled={!intermediateLedgerId} onChange={handleChange}><option value="">Select posting ledger</option>{postingLedgers.map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</select></label><p>Items are not individual ledgers. This mapping connects item stock/value to the company's existing Chart of Accounts.</p></section>}
 <button type="submit" disabled={busy}>{busy?"Saving...":editingId?"Update Item":"Save Item"}</button>{editingId&&<button type="button" onClick={reset}>Cancel Edit</button>}
 </form>
 <table className="item-grid"><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Accounting Classification</th><th>HSN/SAC</th><th>UOM</th><th>GST %</th><th>Sales Rate</th><th>Action</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.item_code}</td><td>{item.item_name}</td><td>{item.item_type}</td><td>{item.accounting_item_type||"—"}</td><td>{item.hsn_sac}</td><td>{item.unit}</td><td>{item.gst_rate}</td><td>{item.sales_rate}</td><td><button type="button" onClick={()=>handleEdit(item)}>Edit</button><button type="button" onClick={()=>handleDelete(item.id)}>Delete</button></td></tr>)}</tbody></table></div>;
}
export default Items;
