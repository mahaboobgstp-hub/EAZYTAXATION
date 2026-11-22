import { supabase } from "../supabase/supabaseClient";

export const ASSET_METHODS = {
  COA: "chart_of_accounts",
  SIMPLE: "without_chart_of_accounts",
};
export const assetMethodLabel = method => method === ASSET_METHODS.COA ? "Chart of Accounts (Integrated Accounting)" : "Without Chart of Accounts (Asset Register Only)";
export const money = value => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value)||0);
export const getAssetBookValue = (asset, asOf = new Date()) => {
  const cost = Number(asset.capitalized_cost ?? asset.purchase_value ?? 0);
  const residual = Number(asset.residual_value || 0);
  const method = asset.depreciation_method || "Straight Line (SLM)";
  const rate = Number(asset.depreciation_rate || 0);
  const usefulLife = Number(asset.useful_life || 0);
  const start = asset.depreciation_start_date || asset.purchase_date;
  if (!start || !cost || asOf < new Date(start)) return { depreciation: 0, bookValue: cost };
  const months = Math.max(0, Math.floor((asOf.getFullYear()-new Date(start).getFullYear())*12 + asOf.getMonth()-new Date(start).getMonth()));
  const depreciable = Math.max(0,cost-residual);
  let depreciation = 0;
  if (method.includes("WDV")) {
    const annualRate = rate/100;
    depreciation = cost * (1-Math.pow(1-annualRate,months/12));
  } else if (usefulLife > 0) {
    depreciation = depreciable * Math.min(1,months/(usefulLife*12));
  } else if (rate > 0) {
    depreciation = depreciable * Math.min(1,months/12*rate/100);
  }
  depreciation = Math.min(depreciable,Math.max(0,depreciation));
  return { depreciation, bookValue: Math.max(residual,cost-depreciation) };
};
export const loadAssets = async companyId => {
  if(!companyId) return [];
  const {data,error}=await supabase.from("fixed_assets").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
  if(error) throw error; return data||[];
};
export const saveAsset = async (companyId,payload) => {
  const {data:{user},error:userError}=await supabase.auth.getUser(); if(userError) throw userError;
  const {data:existing,error}=await supabase.from("fixed_assets").select("asset_code").eq("company_id",companyId);
  if(error) throw error;
  const next=Math.max(0,...(existing||[]).map(a=>Number(String(a.asset_code||"").replace(/^FA-/,""))||0))+1;
  const row={...payload,company_id:companyId,asset_code:payload.asset_code?.trim()||"FA-"+String(next).padStart(4,"0"),created_by:user?.id||null,status:payload.status||"Active"};
  const {error:insertError}=await supabase.from("fixed_assets").insert(row); if(insertError) throw insertError;
};
export const updateAsset = async (companyId,id,payload) => {const {error}=await supabase.from("fixed_assets").update({...payload,updated_at:new Date().toISOString()}).eq("id",id).eq("company_id",companyId);if(error)throw error;};
export const deleteAsset = async (companyId,id) => {const {error}=await supabase.from("fixed_assets").delete().eq("id",id).eq("company_id",companyId);if(error)throw error;};
export const loadCategories = async companyId => {const {data,error}=await supabase.from("asset_categories").select("*").or(`company_id.eq.${companyId},company_id.is.null`).order("category_name");if(error)throw error;const rows=data||[];const companyRows=rows.filter(c=>c.company_id===companyId);if(companyRows.length===0){const starter=[{category_name:"Computers & IT Equipment",description:"Starter category — edit to match company policy",depreciation_method:"Straight Line (SLM)",useful_life_years:3,depreciation_rate:null,residual_value:0},{category_name:"Furniture & Fixtures",description:"Starter category — edit to match company policy",depreciation_method:"Straight Line (SLM)",useful_life_years:10,depreciation_rate:null,residual_value:0},{category_name:"Plant & Machinery",description:"Starter category — edit to match company policy",depreciation_method:"Straight Line (SLM)",useful_life_years:10,depreciation_rate:null,residual_value:0},{category_name:"Vehicles",description:"Starter category — edit to match company policy",depreciation_method:"Straight Line (SLM)",useful_life_years:8,depreciation_rate:null,residual_value:0}];const {error:seedError}=await supabase.from("asset_categories").insert(starter.map(c=>({...c,company_id:companyId})));if(seedError)throw seedError;const {data:seeded,error:reloadError}=await supabase.from("asset_categories").select("*").eq("company_id",companyId).order("category_name");if(reloadError)throw reloadError;return seeded||[];}const names=new Set(companyRows.map(c=>c.category_name.toLowerCase()));return [...companyRows,...rows.filter(c=>c.company_id===null&&!names.has(c.category_name.toLowerCase()))];};
export const saveCategory = async (companyId,category) => {const {error}=await supabase.from("asset_categories").insert({...category,company_id:companyId});if(error)throw error;};
export const updateCategory = async (companyId,id,category) => {const {error}=await supabase.from("asset_categories").update(category).eq("id",id).eq("company_id",companyId);if(error)throw error;};
export const deleteCategory = async (companyId,id) => {const {error}=await supabase.from("asset_categories").delete().eq("id",id).eq("company_id",companyId);if(error)throw error;};
export const listTable = async (table,companyId,order="created_at")=>{const {data,error}=await supabase.from(table).select("*").eq("company_id",companyId).order(order,{ascending:false});if(error)throw error;return data||[];};
export const insertRecord = async (table,companyId,record)=>{const {error}=await supabase.from(table).insert({...record,company_id:companyId});if(error)throw error;};
export const updateRecord = async (table,companyId,id,record)=>{const {error}=await supabase.from(table).update({...record,updated_at:new Date().toISOString()}).eq("company_id",companyId).eq("id",id);if(error)throw error;};
export const removeRecord = async (table,companyId,id)=>{const {error}=await supabase.from(table).delete().eq("company_id",companyId).eq("id",id);if(error)throw error;};
