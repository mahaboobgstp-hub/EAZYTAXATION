import {supabase} from "../supabase/supabaseClient";
import {getMasterAccountingSetup} from "./masterAccountingService";

export const SYD_ACCOUNTING_MAPPING_OPTIONS=[
 {key:"default_sales_ledger",label:"Default Sales Ledger",group:"Sales & Income",description:"Fallback income account for sales items without an item-specific sales mapping."},
 {key:"default_purchase_ledger",label:"Default Purchase Ledger",group:"Purchases & Expenses",description:"Fallback purchase account for non-stock items without an item-specific purchase mapping."},
 {key:"default_expense_ledger",label:"Default Expense Ledger",group:"Purchases & Expenses",description:"Fallback ledger for expense categories without a linked ledger."},
 {key:"output_cgst_ledger",label:"Output CGST Ledger",group:"GST",description:"Output CGST liability account."},
 {key:"output_sgst_ledger",label:"Output SGST Ledger",group:"GST",description:"Output SGST liability account."},
 {key:"output_igst_ledger",label:"Output IGST Ledger",group:"GST",description:"Output IGST liability account."},
 {key:"output_cess_ledger",label:"Output Cess Ledger",group:"GST",description:"Output cess liability account."},
 {key:"output_additional_cess_ledger",label:"Output Additional Cess Ledger",group:"GST",description:"Additional cess liability account."},
 {key:"input_cgst_ledger",label:"Input CGST Ledger",group:"GST",description:"Input CGST credit account."},
 {key:"input_sgst_ledger",label:"Input SGST Ledger",group:"GST",description:"Input SGST credit account."},
 {key:"input_igst_ledger",label:"Input IGST Ledger",group:"GST",description:"Input IGST credit account."},
 {key:"input_cess_ledger",label:"Input Cess Ledger",group:"GST",description:"Input cess credit account."},
 {key:"round_off_ledger",label:"Round-off Ledger",group:"Other",description:"Small invoice rounding adjustments."},
 {key:"other_charges_ledger",label:"Other Charges Ledger",group:"Other",description:"Account for invoice-level additional charges."},
 {key:"inventory_ledger",label:"Default Inventory Ledger",group:"Inventory",description:"Fallback inventory/stock value account."},
 {key:"cogs_ledger",label:"Default Cost of Goods Sold Ledger",group:"Inventory",description:"Fallback cost-of-goods-sold account."},
 {key:"cash_ledger",label:"Default Cash Ledger",group:"Cash & Banking",description:"Fallback cash ledger."},
 {key:"bank_ledger",label:"Default Bank Ledger",group:"Cash & Banking",description:"Fallback bank ledger where no bank master is linked."}
];

export async function getSYDAccountingMappings(companyId){
 if(!companyId)return {enabled:false,ledgers:[],mappings:{}};
 const setup=await getMasterAccountingSetup(companyId);
 if(!setup.enabled)return {enabled:false,ledgers:setup.ledgers,mappings:{}};
 const {data,error}=await supabase.from("syd_accounting_mappings").select("mapping_key,ledger_id").eq("company_id",companyId);
 if(error)throw error;
 return {enabled:true,ledgers:setup.ledgers.filter(l=>l.is_active!==false&&l.is_posting_enabled!==false),mappings:Object.fromEntries((data||[]).map(row=>[row.mapping_key,row.ledger_id]))};
}

export async function saveSYDAccountingMapping(companyId,mappingKey,ledgerId){
 if(!companyId||!mappingKey||!ledgerId)throw new Error("Company, mapping and ledger are required.");
 const {data:ledger,error:ledgerError}=await supabase.from("chart_of_accounts").select("id").eq("company_id",companyId).eq("id",ledgerId).eq("is_active",true).eq("is_posting_enabled",true).maybeSingle();
 if(ledgerError)throw ledgerError;if(!ledger)throw new Error("Selected ledger is not valid for this company.");
 const {error}=await supabase.from("syd_accounting_mappings").upsert({company_id:companyId,mapping_key:mappingKey,ledger_id:ledgerId,updated_at:new Date().toISOString()},{onConflict:"company_id,mapping_key"});
 if(error)throw error;
 return true;
}
