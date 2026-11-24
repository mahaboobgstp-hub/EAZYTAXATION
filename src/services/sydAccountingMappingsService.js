import {supabase} from "../supabase/supabaseClient";
import {getMasterAccountingSetup} from "./masterAccountingService";

export const SYD_ACCOUNTING_MAPPING_OPTIONS=[
 {key:"default_sales_ledger",label:"Default Sales Ledger",group:"Sales & Income",nature:"Income",description:"Fallback income account for sales items without an item-specific sales mapping."},
 {key:"other_charges_ledger",label:"Other Charges Ledger",group:"Sales & Income",nature:"Income",description:"Account for invoice-level additional charges."},
 {key:"default_purchase_ledger",label:"Default Purchase Ledger",group:"Purchases & Expenses",nature:"Expense",description:"Fallback purchase account for non-stock items without an item-specific purchase mapping."},
 {key:"default_expense_ledger",label:"Default Expense Ledger",group:"Purchases & Expenses",nature:"Expense",description:"Fallback ledger for expense categories without a linked ledger."},
 {key:"default_expense_payable_ledger",label:"Default Expense Payable Ledger",group:"Purchases & Expenses",nature:"Liability",description:"Liability ledger for expenses without a supplier party."},
 {key:"output_cgst_ledger",label:"Output CGST Ledger",group:"GST",nature:"Liability",description:"Output CGST liability account."},
 {key:"output_sgst_ledger",label:"Output SGST Ledger",group:"GST",nature:"Liability",description:"Output SGST liability account."},
 {key:"output_igst_ledger",label:"Output IGST Ledger",group:"GST",nature:"Liability",description:"Output IGST liability account."},
 {key:"output_cess_ledger",label:"Output Cess Ledger",group:"GST",nature:"Liability",description:"Output cess liability account."},
 {key:"output_additional_cess_ledger",label:"Output Additional Cess Ledger",group:"GST",nature:"Liability",description:"Additional cess liability account."},
 {key:"input_cgst_ledger",label:"Input CGST Ledger",group:"GST",nature:"Asset",description:"Input CGST credit account."},
 {key:"input_sgst_ledger",label:"Input SGST Ledger",group:"GST",nature:"Asset",description:"Input SGST credit account."},
 {key:"input_igst_ledger",label:"Input IGST Ledger",group:"GST",nature:"Asset",description:"Input IGST credit account."},
 {key:"input_cess_ledger",label:"Input Cess Ledger",group:"GST",nature:"Asset",description:"Input cess credit account."},
 {key:"round_off_ledger",label:"Round-off Ledger",group:"Other",nature:null,description:"Small invoice rounding adjustments."},
 {key:"inventory_ledger",label:"Default Inventory Ledger",group:"Inventory",nature:"Asset",description:"Fallback inventory/stock value account."},
 {key:"cogs_ledger",label:"Default Cost of Goods Sold Ledger",group:"Inventory",nature:"Expense",description:"Fallback cost-of-goods-sold account."},
 {key:"cash_ledger",label:"Default Cash Ledger",group:"Cash & Banking",nature:"Asset",description:"Fallback cash ledger."},
 {key:"bank_ledger",label:"Default Bank Ledger",group:"Cash & Banking",nature:"Asset",description:"Fallback bank ledger where no bank master is linked."}
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
 if(ledgerError)throw ledgerError;if(!ledger)throw new Error("Selected ledger is not valid for this company.");\n const option=SYD_ACCOUNTING_MAPPING_OPTIONS.find(x=>x.key===mappingKey);if(option?.nature){const {data:group,error:groupError}=await supabase.from("account_groups").select("account_nature").eq("company_id",companyId).eq("id",ledger.group_id).maybeSingle();if(groupError)throw groupError;if(group?.account_nature!==option.nature)throw new Error("Select a ledger from the "+option.nature+" account group for this mapping.");}
 const {error}=await supabase.from("syd_accounting_mappings").upsert({company_id:companyId,mapping_key:mappingKey,ledger_id:ledgerId,updated_at:new Date().toISOString()},{onConflict:"company_id,mapping_key"});
 if(error)throw error;
 return true;
}
