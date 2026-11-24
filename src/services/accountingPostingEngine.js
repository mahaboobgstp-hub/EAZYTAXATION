import {supabase} from "../supabase/supabaseClient";
import {createVoucher,postVoucher} from "./accountingService";

const money=value=>Math.round((Number(value)||0)*100)/100;

/**
 * Shared posting gateway for operational transactions.
 * Callers provide fully mapped lines; this engine never guesses ledgers.
 * Accounting-disabled companies are intentionally left untouched.
 */
export async function getCompanyAccountingCapability(companyId){
 if(!companyId)return {enabled:false,reason:"No company selected"};
 const {data:company,error}=await supabase.from("companies").select("accounting_enabled").eq("id",companyId).single();
 if(error)throw error;
 if(!company?.accounting_enabled)return {enabled:false,reason:"Accounting is not enabled for this company"};
 const {count,error:ledgerError}=await supabase.from("chart_of_accounts").select("id",{count:"exact",head:true}).eq("company_id",companyId);
 if(ledgerError)throw ledgerError;
 if(!count)return {enabled:false,reason:"Chart of Accounts is not configured"};
 return {enabled:true};
}

export async function postBusinessTransaction(companyId,transaction){
 const capability=await getCompanyAccountingCapability(companyId);
 if(!capability.enabled)return {status:"skipped",reason:capability.reason};
 if(!transaction?.source_module||!transaction?.source_record_id)throw new Error("Source module and source record ID are required for idempotent accounting posting.");
 const lines=(transaction.lines||[]).map(line=>({ledger_id:line.ledger_id,debit:money(line.debit),credit:money(line.credit),line_narration:line.line_narration||transaction.narration||null}));
 if(lines.length<2)throw new Error("Auto-posting requires at least two mapped accounting lines.");
 const debit=money(lines.reduce((sum,line)=>sum+line.debit,0)),credit=money(lines.reduce((sum,line)=>sum+line.credit,0));
 if(debit<=0||Math.abs(debit-credit)>0.005)throw new Error("Automatic accounting lines must balance.");
 if(lines.some(line=>!line.ledger_id||line.debit<0||line.credit<0||(line.debit>0&&line.credit>0)||(line.debit===0&&line.credit===0)))throw new Error("Invalid accounting line. Each line must contain a ledger and one positive debit or credit.");
 const {data:ledgers,error:ledgerError}=await supabase.from("chart_of_accounts").select("id,is_active,is_posting_enabled").eq("company_id",companyId).in("id",lines.map(x=>x.ledger_id));
 if(ledgerError)throw ledgerError;
 const ledgerMap=new Map((ledgers||[]).map(x=>[x.id,x]));
 if(lines.some(line=>{const l=ledgerMap.get(line.ledger_id);return !l||l.is_active===false||l.is_posting_enabled===false;}))throw new Error("One or more mapped ledgers are inactive, missing, or not posting-enabled.");

 const existingQuery=()=>supabase.from("accounting_vouchers").select("*").eq("company_id",companyId).eq("source_module",transaction.source_module).eq("source_record_id",transaction.source_record_id).neq("status","Reversed").limit(1);
 let {data:existing,error:existingError}=await existingQuery();
 if(existingError)throw existingError;
 if(existing?.length){if(existing[0].status==="Posted")return {status:"already_posted",voucher:existing[0]};if(existing[0].status==="Draft"){await postVoucher(companyId,existing[0].id);return {status:"posted",voucher:existing[0]};}}

 const voucherNumber=transaction.voucher_number||`AUTO-${transaction.source_module.toUpperCase()}-${String(transaction.source_record_id).slice(0,8)}`;
 try{
  const voucher=await createVoucher(companyId,{voucher_number:voucherNumber,voucher_type:transaction.voucher_type||"Journal",voucher_date:transaction.voucher_date,reference_number:transaction.reference_number||null,narration:transaction.narration||null,source_module:transaction.source_module,source_record_id:transaction.source_record_id,status:"Draft"},lines);
  const posted=await postVoucher(companyId,voucher.id);
  return {status:"posted",voucher:posted};
 }catch(error){
  const retry=await existingQuery();
  if(retry.error)throw error;
  if(retry.data?.[0]?.status==="Posted")return {status:"already_posted",voucher:retry.data[0]};
  throw error;
 }
}
