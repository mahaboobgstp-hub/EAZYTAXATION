import { supabase } from "../supabase/supabaseClient";

const n=v=>Number(v)||0;
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const dateOk=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""))&&Number.isFinite(Date.parse(s));
const findParty=(list,gstin,name,field)=>list.find(x=>gstin&&norm(x.gstin)===norm(gstin))||list.find(x=>norm(x[field])===norm(name));
const taxFor=(taxable,rate,same)=>{const tax=taxable*rate/100;return same?{cgst:tax/2,sgst:tax/2,igst:0}:{cgst:0,sgst:0,igst:tax};};

export async function importSalesCsvRows(rows,companyId,company){
 const [{data:customers,error:cErr},{data:items,error:iErr},{data:existing,error:eErr}]=await Promise.all([
 supabase.from("customers").select("id,customer_name,gstin,state,address").eq("company_id",companyId),
 supabase.from("items").select("id,item_name,hsn_sac,unit,gst_rate,sales_rate").eq("company_id",companyId),
 supabase.from("sales_invoices").select("invoice_no").eq("company_id",companyId).eq("is_deleted",false)
 ]);
 if(cErr)throw cErr;if(iErr)throw iErr;if(eErr)throw eErr;
 const groups=new Map();const issues=[];
 rows.forEach((r,idx)=>{const no=r["Invoice Number"]?.trim(),date=r["Invoice Date"]?.trim(),customerName=r["Customer Name"]?.trim(),itemName=r["Item Name"]?.trim();
 if(!no||!dateOk(date)||!customerName||!itemName){issues.push("CSV row "+(idx+2)+": invoice number, valid date, customer and item are required.");return;}
 const key=no;const g=groups.get(key)||{no,date,customerName,gstin:r["Customer GSTIN"],place:r["Place of Supply"],saleType:r["Sale Type"]||"CREDIT",narration:r["Narration"],lines:[]};
 if(g.date!==date||norm(g.customerName)!==norm(customerName)){issues.push("CSV row "+(idx+2)+": invoice "+no+" has inconsistent invoice header values.");return;}
 const item=items.find(x=>norm(x.item_name)===norm(itemName));const qty=n(r["Quantity"]),rate=n(r["Rate"]),discPct=n(r["Discount %"]),gstRate=n(r["GST Rate %"]),cessRate=n(r["Cess Rate %"]);
 if(qty<=0||rate<0||discPct<0||discPct>100||gstRate<0){issues.push("CSV row "+(idx+2)+": invalid quantity/rate/discount/GST.");return;}
 const gross=qty*rate,discount=gross*discPct/100,taxable=gross-discount,taxes=taxFor(taxable,gstRate,norm(company?.state)===norm(r["Place of Supply"]));
 const cess=taxable*cessRate/100;g.lines.push({item_id:item?.id||null,item_name:itemName,hsn_sac:r["HSN/SAC"]||item?.hsn_sac||"",unit:r["Unit"]||item?.unit||"",qty,rate,gst_rate:gstRate,amount:taxable+taxes.cgst+taxes.sgst+taxes.igst+cess,cess_rate:cessRate,cess_amount:cess,additional_cess_rate:0,additional_cess_amount:0,tax_inclusive:false});
 g.taxable=(g.taxable||0)+taxable;g.cgst=(g.cgst||0)+taxes.cgst;g.sgst=(g.sgst||0)+taxes.sgst;g.igst=(g.igst||0)+taxes.igst;g.cess=(g.cess||0)+cess;groups.set(key,g);
 });
 if(issues.length)throw new Error(issues.slice(0,8).join(" | "));
 const duplicateNos=new Set((existing||[]).map(x=>norm(x.invoice_no)));let imported=0,skipped=0,failed=[];
 for(const g of groups.values()){if(duplicateNos.has(norm(g.no))){skipped++;continue;}
 const customer=findParty(customers,g.gstin,g.customerName,"customer_name");
 const header={company_id:companyId,invoice_no:g.no,invoice_date:g.date,customer_id:customer?.id||null,customer_name:g.customerName,customer_state:customer?.state||"",company_name:company?.company_name||"",company_state:company?.state||"",place_of_supply:g.place||customer?.state||"",gst_type:norm(company?.state)===norm(g.place||customer?.state)?"INTRA_STATE":"INTER_STATE",sale_type:g.saleType,tax_inclusive:false,discount_type:"percentage",discount_value:0,discount_amount:0,taxable_value:g.taxable||0,cgst:g.cgst||0,sgst:g.sgst||0,igst:g.igst||0,cess_amount:g.cess||0,additional_cess_amount:0,other_amount:n(g.lines[0]?.other_charges),round_off:n(g.lines[0]?.round_off),total_amount:g.lines.reduce((s,l)=>s+l.amount,0),remarks:g.narration||"",payment_status:"Unpaid",paid_amount:0};
 const {data:h,error:he}=await supabase.from("sales_invoices").insert(header).select("id").single();if(he){failed.push(g.no+": "+he.message);continue;}
 const lineRecords=g.lines.map((l,index)=>({...l,invoice_id:h.id,line_no:index+1,particulars:l.item_name}));
 const {error:le}=await supabase.from("sales_invoice_items").insert(lineRecords);if(le){await supabase.from("sales_invoices").delete().eq("id",h.id).eq("company_id",companyId);failed.push(g.no+": "+le.message);continue;} imported++;duplicateNos.add(norm(g.no));
 }
 return {imported,skipped,failed};
}

export async function importPurchaseCsvRows(rows,companyId,company){
 const [{data:vendors,error:vErr},{data:itemsData,error:iErr},{data:existing,error:eErr}]=await Promise.all([
 supabase.from("vendors").select("id,vendor_name,gstin,state,address").eq("company_id",companyId),
 supabase.from("items").select("id,item_name,hsn_sac,unit,gst_rate,purchase_rate").eq("company_id",companyId),
 supabase.from("purchase_invoices").select("supplier_invoice_no,vendor_id").eq("company_id",companyId).eq("is_deleted",false)
 ]);
 if(vErr)throw vErr;if(iErr)throw iErr;if(eErr)throw eErr;
 let items=[...(itemsData||[])];
 // Summary-based purchase imports are not itemized. Create a non-inventory Service
 // master for this specific placeholder instead of forcing users to add it manually.
 const summaryNames=new Set(rows.map(r=>String(r["Item Name"]||"").trim()).filter(Boolean));
 let createdSummaryItem=false;
 if(summaryNames.has("Purchase Summary")&&!items.some(x=>norm(x.item_name)==="purchase summary")){
   const {data:created,error:createError}=await supabase.from("items").insert({
     company_id:companyId,item_name:"Purchase Summary",item_type:"Service",hsn_sac:null,
     unit:"Nos",uom:"Nos",gst_rate:18,sales_rate:0,purchase_rate:0
   }).select("id,item_name,hsn_sac,unit,gst_rate,purchase_rate").single();
   if(createError)throw createError;
   items.push(created);createdSummaryItem=true;
 }
 const groups=new Map(),issues=[];
 rows.forEach((r,idx)=>{const supplierNo=r["Supplier Invoice Number"]?.trim(),date=r["Supplier Invoice Date"]?.trim(),vendorName=r["Vendor Name"]?.trim(),itemName=r["Item Name"]?.trim();
 if(!supplierNo||!dateOk(date)||!vendorName||!itemName){issues.push("CSV row "+(idx+2)+": supplier invoice number, valid date, vendor and item are required.");return;}
 const key=norm(supplierNo)+"|"+norm(r["Vendor GSTIN"]||vendorName);const g=groups.get(key)||{supplierNo,date,vendorName,gstin:r["Vendor GSTIN"],place:r["Place of Supply"],gstTreatment:r["GST Treatment"]||"Regular Supplier (Registered)",remarks:r["Narration"],lines:[]};
 const item=items.find(x=>norm(x.item_name)===norm(itemName));const qty=n(r["Quantity"]),rate=n(r["Rate"]),discountPct=n(r["Discount %"]),gstRate=n(r["GST Rate %"]);
 if(qty<=0||rate<0||discountPct<0||discountPct>100||gstRate<0){issues.push("CSV row "+(idx+2)+": invalid quantity/rate/discount/GST.");return;}
 if(!item){issues.push("CSV row "+(idx+2)+": item '"+itemName+"' must exist in Items master first.");return;}
 const gross=qty*rate,discount=gross*discountPct/100,taxable=gross-discount,tax=taxFor(taxable,gstRate,n(company?.state)&&norm(company?.state)===norm(r["Place of Supply"]));
 const total=taxable+tax.cgst+tax.sgst+tax.igst;
 g.lines.push({item_id:item.id,item_name:itemName,hsn_sac:r["HSN/SAC"]||item.hsn_sac||"",uom:r["Unit"]||item.unit||"",qty,rate,gross_amount:gross,discount_percent:discountPct,discount_amount:discount,taxable_value:taxable,gst_rate:gstRate,cgst_amount:tax.cgst,sgst_amount:tax.sgst,igst_amount:tax.igst,line_total:total,remarks:""});
 g.taxable=(g.taxable||0)+taxable;g.cgst=(g.cgst||0)+tax.cgst;g.sgst=(g.sgst||0)+tax.sgst;g.igst=(g.igst||0)+tax.igst;groups.set(key,g);
 });
 if(issues.length)throw new Error(issues.slice(0,8).join(" | "));
 let imported=0,skipped=0,failed=[];
 for(const g of groups.values()){const vendor=findParty(vendors,g.gstin,g.vendorName,"vendor_name");if(!vendor){failed.push(g.supplierNo+": vendor not found in Vendors master (GSTIN/name).");continue;}
 if((existing||[]).some(x=>norm(x.supplier_invoice_no)===norm(g.supplierNo)&&x.vendor_id===vendor.id)){skipped++;continue;}
 const no="IMP-PI-"+Date.now().toString().slice(-6)+"-"+String(imported+1).padStart(3,"0");
 const raw=g.taxable+g.cgst+g.sgst+g.igst,grand=Math.round(raw),round=grand-raw;
 const header={company_id:companyId,vendor_id:vendor.id,invoice_no:no,invoice_date:g.date,supplier_invoice_no:g.supplierNo,supplier_invoice_date:g.date,gstin:g.gstin||vendor.gstin||"",vendor_state:vendor.state||"",place_of_supply:g.place||vendor.state||"",gst_treatment:g.gstTreatment,taxable:g.taxable,cgst:g.cgst,sgst:g.sgst,igst:g.igst,round_off:round,grand_total:grand,payment_status:"Unpaid",paid_amount:0,remarks:g.remarks||"",is_deleted:false};
 const {data:h,error:he}=await supabase.from("purchase_invoices").insert(header).select("id").single();if(he){failed.push(g.supplierNo+": "+he.message);continue;}
 const {error:le}=await supabase.from("purchase_invoice_items").insert(g.lines.map((l,i)=>({...l,invoice_id:h.id,line_no:i+1})));
 if(le){await supabase.from("purchase_invoices").delete().eq("id",h.id).eq("company_id",companyId);failed.push(g.supplierNo+": "+le.message);continue;}imported++;existing.push({supplier_invoice_no:g.supplierNo,vendor_id:vendor.id});
 }
 return {imported,skipped,failed,createdSummaryItem};
}

export async function importExpenseCsvRows(rows,companyId,company){
 const [{data:vendors,error:vErr},{data:initialCategories,error:cErr},{data:existing,error:eErr}]=await Promise.all([
 supabase.from("vendors").select("id,vendor_name,gstin,state").eq("company_id",companyId),
 supabase.from("expense_categories").select("id,category_name"),
 supabase.from("expenses").select("expense_no,supplier_invoice_no,vendor_id").eq("company_id",companyId)
 ]);
 if(vErr)throw vErr;if(cErr)throw cErr;if(eErr)throw eErr;
 const categoriesByKey=new Map((initialCategories||[]).map(c=>[norm(c.category_name),c]));
 const requestedNames=[...new Set(rows.map(r=>String(r["Expense Category"]||"").trim()).filter(Boolean))];
 const missingNames=requestedNames.filter(name=>!categoriesByKey.has(norm(name)));
 for(const categoryName of missingNames){
   const {error:insertError}=await supabase.from("expense_categories").insert({category_name:categoryName});
   if(insertError && !/duplicate|unique/i.test(insertError.message||"")) throw insertError;
 }
 const {data:categories,error:refreshError}=await supabase.from("expense_categories").select("id,category_name");
 if(refreshError)throw refreshError;
 const categoryMap=new Map((categories||[]).map(c=>[norm(c.category_name),c]));
 const issues=[];
 const records=rows.map((r,idx)=>{
   const date=String(r["Expense Date"]||"").trim(),categoryName=String(r["Expense Category"]||"").trim(),desc=String(r["Description"]||"").trim(),qty=n(r["Quantity"]||1),rate=n(r["Rate"]),discPct=n(r["Discount %"]),gstRate=n(r["GST Rate %"]),vendor=findParty(vendors,r["Supplier GSTIN"],r["Payee / Supplier Name"],"vendor_name"),category=categoryMap.get(norm(categoryName));
   if(!dateOk(date)||!categoryName||!desc||qty<=0||rate<0||discPct<0||discPct>100||gstRate<0){issues.push("CSV row "+(idx+2)+": invalid/missing date, category, description or numeric values.");return null;}
   if(!category){issues.push("CSV row "+(idx+2)+": expense category '"+categoryName+"' could not be created or found.");return null;}
   const gross=qty*rate,discount=gross*discPct/100,taxable=gross-discount,registered=(r["GST Treatment"]||"No GST")!=="No GST",effective=registered?gstRate:0,same=norm(company?.state)&&norm(vendor?.state||r["Place of Supply"])===norm(company?.state),taxes=taxFor(taxable,effective,same);
   return {row:r,date,category,vendor,desc,qty,rate,discPct,gstRate:effective,gross,discount,taxable,taxes,total:taxable+taxes.cgst+taxes.sgst+taxes.igst};
 });
 if(issues.length)throw new Error(issues.slice(0,8).join(" | "));
 let imported=0,skipped=0,failed=[];
 for(const r of records.filter(Boolean)){
   const invNo=String(r.row["Supplier Invoice Number"]||"").trim()||null;
   if(invNo&&(existing||[]).some(x=>norm(x.supplier_invoice_no)===norm(invNo)&&(!r.vendor||x.vendor_id===r.vendor.id))){skipped++;continue;}
   const expenseNo=String(r.row["Expense Number"]||"").trim()||"IMP-EXP-"+r.date.replaceAll("-","")+"-"+String(imported+1).padStart(4,"0");
   if((existing||[]).some(x=>norm(x.expense_no)===norm(expenseNo))){skipped++;continue;}
   const paymentStatus=r.row["Payment Status"]||"Unpaid";
   const header={company_id:companyId,expense_no:expenseNo,expense_date:r.date,category_id:r.category.id,vendor_id:r.vendor?.id||null,payee_name:r.row["Payee / Supplier Name"]||r.vendor?.vendor_name||"",supplier_invoice_no:invNo,supplier_invoice_date:r.row["Supplier Invoice Date"]||null,payment_mode:r.row["Payment Mode"]||"Bank",payment_account:r.row["Payment Account"]||"",reference_no:r.row["Reference Number"]||"",gst_treatment:r.row["GST Treatment"]||"No GST",is_gst_applicable:r.gstRate>0,taxable_amount:r.taxable,gst_percent:r.taxable?r.gstRate:0,cgst:r.taxes.cgst,sgst:r.taxes.sgst,igst:r.taxes.igst,discount_amount:r.discount,other_charges:n(r.row["Other Charges"]),round_off:0,total_amount:r.total+n(r.row["Other Charges"]),paid_amount:0,payment_status:paymentStatus,status:"Posted",remarks:r.row["Narration"]||"",is_gst_inclusive:false};
   const {data:h,error:he}=await supabase.from("expenses").insert(header).select("id").single();if(he){failed.push(expenseNo+": "+he.message);continue;}
   const {error:le}=await supabase.from("expense_items").insert([{expense_id:h.id,line_no:1,description:r.desc,hsn_sac:r.row["HSN/SAC"]||"",qty:r.qty,uom:r.row["Unit"]||"",rate:r.rate,discount_percent:r.discPct,discount_amount:r.discount,taxable_amount:r.taxable,gst_percent:r.gstRate,cgst_amount:r.taxes.cgst,sgst_amount:r.taxes.sgst,igst_amount:r.taxes.igst,total_amount:r.total}]);
   if(le){await supabase.from("expenses").delete().eq("id",h.id).eq("company_id",companyId);failed.push(expenseNo+": "+le.message);continue;}imported++;existing.push({expense_no:expenseNo,supplier_invoice_no:invNo,vendor_id:r.vendor?.id||null});
 }
 return {imported,skipped,failed,categoriesCreated:missingNames.length};
}
