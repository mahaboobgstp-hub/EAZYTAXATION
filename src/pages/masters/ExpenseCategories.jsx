import React,{useEffect,useMemo,useState} from "react";
import BulkTransactionImport from "../../components/BulkTransactionImport";
import {useCompany} from "../../context/CompanyContext";
import {getMasterAccountingSetup,mainGroupsForMaster,childGroupsForMaster,ledgersForMasterGroup} from "../../services/masterAccountingService";
import {createExpenseCategory,getExpenseCategories} from "../../services/expenseCategoryService";
import "../../css/masters/ExpenseCategories.css";

function ExpenseCategories(){
 const {currentCompanyId}=useCompany();
 const [categories,setCategories]=useState([]);
 const [categoryName,setCategoryName]=useState("");
 const [setup,setSetup]=useState({enabled:false,groups:[],ledgers:[]});
 const [mainGroupId,setMainGroupId]=useState("");
 const [intermediateGroupId,setIntermediateGroupId]=useState("");
 const [subgroupId,setSubgroupId]=useState("");
 const [ledgerId,setLedgerId]=useState("");
 useEffect(()=>{if(currentCompanyId){loadCategories();getMasterAccountingSetup(currentCompanyId).then(setSetup).catch(e=>console.warn(e));}else{setCategories([]);setSetup({enabled:false,groups:[],ledgers:[]});}},[currentCompanyId]);
 const loadCategories=async()=>{try{setCategories(await getExpenseCategories(currentCompanyId)||[]);}catch(e){console.error(e);}};
 const expenseGroupPattern=/(expense|purchase|cost)/i;
 const mainGroups=useMemo(()=>mainGroupsForMaster(setup,"Expense").filter(g=>expenseGroupPattern.test(g.group_name)||childGroupsForMaster(setup,g.id).some(child=>expenseGroupPattern.test(child.group_name)||childGroupsForMaster(setup,child.id).some(sub=>expenseGroupPattern.test(sub.group_name)))),[setup]);
 const intermediateGroups=useMemo(()=>childGroupsForMaster(setup,mainGroupId).filter(g=>expenseGroupPattern.test(g.group_name)||childGroupsForMaster(setup,g.id).some(sub=>expenseGroupPattern.test(sub.group_name))),[setup,mainGroupId]);
 const subgroupGroups=useMemo(()=>childGroupsForMaster(setup,intermediateGroupId).filter(g=>expenseGroupPattern.test(g.group_name)),[setup,intermediateGroupId]);
 const finalGroupId=subgroupId||intermediateGroupId||mainGroupId;
 const ledgers=useMemo(()=>ledgersForMasterGroup(setup,finalGroupId),[setup,finalGroupId]);
 const handleSubmit=async e=>{e.preventDefault();if(!currentCompanyId){alert("Select a company first.");return;}if(setup.enabled&&mainGroups.length&&(!mainGroupId||(intermediateGroups.length&&!intermediateGroupId))){alert("Select the expense account group path.");return;}if(setup.enabled&&finalGroupId&&!expenseGroupPattern.test(setup.groups.find(g=>g.id===finalGroupId)?.group_name||"")){alert("Select an Expense, Purchase or Cost account group.");return;}if(setup.enabled&&ledgers.length&&!ledgerId){alert("Select the posting ledger for this expense category.");return;}try{await createExpenseCategory({category_name:categoryName.trim(),group_id:mainGroupId||null,main_group_id:mainGroupId||null,intermediate_group_id:intermediateGroupId||null,subgroup_id:subgroupId||intermediateGroupId||null,ledger_id:ledgerId||null},currentCompanyId);setCategoryName("");setMainGroupId("");setIntermediateGroupId("");setSubgroupId("");setLedgerId("");loadCategories();}catch(error){alert(error.message);}};
 const ledgerName=id=>setup.ledgers.find(l=>l.id===id)?.ledger_name||"";
 return <div className="expense-categories-page"><h2>Expense Categories</h2><BulkTransactionImport kind="expense-categories"/><form className="expense-category-form" onSubmit={handleSubmit}><input placeholder="Category Name" value={categoryName} onChange={e=>setCategoryName(e.target.value)} required/>{setup.enabled&&<section className="expense-category-accounting"><h3>Accounting Classification</h3><label>Main Group<select value={mainGroupId} onChange={e=>{setMainGroupId(e.target.value);setIntermediateGroupId("");setSubgroupId("");setLedgerId("");}}><option value="">Select main expense group</option>{mainGroups.map(g=><option key={g.id} value={g.id}>{g.group_name}</option>)}</select></label><label>Intermediate Group<select value={intermediateGroupId} disabled={!mainGroupId} onChange={e=>{setIntermediateGroupId(e.target.value);setSubgroupId("");setLedgerId("");}}><option value="">Select intermediate group</option>{intermediateGroups.map(g=><option key={g.id} value={g.id}>{g.group_name}</option>)}</select></label><label>Subgroup (optional)<select value={subgroupId} disabled={!intermediateGroupId} onChange={e=>{setSubgroupId(e.target.value);setLedgerId("");}}><option value="">Use intermediate group</option>{subgroupGroups.map(g=><option key={g.id} value={g.id}>{g.group_name}</option>)}</select></label><label>Expense Ledger<select value={ledgerId} disabled={!finalGroupId} onChange={e=>setLedgerId(e.target.value)}><option value="">Select expense ledger</option>{ledgers.map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</select></label><small>Billing-only companies will not see these accounting fields.</small></section>}<button type="submit">Save Category</button></form><table className="expense-category-grid"><thead><tr><th>Category Name</th>{setup.enabled&&<th>Linked Ledger</th>}</tr></thead><tbody>{categories.map(category=><tr key={category.id}><td>{category.category_name}</td>{setup.enabled&&<td>{ledgerName(category.ledger_id)||"Not mapped"}</td>}</tr>)}</tbody></table></div>;
}
export default ExpenseCategories;
