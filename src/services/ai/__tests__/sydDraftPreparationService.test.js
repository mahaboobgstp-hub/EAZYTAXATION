import test from "node:test";
import assert from "node:assert/strict";
import { prepareSYDValidatedDraft } from "../sydDraftPreparationService.js";

test("draft validator blocks unsupported screens and missing company",()=>{
  assert.equal(prepareSYDValidatedDraft({plan:{screen_id:"banking"},companyId:"co"}).ok,false);
  assert.equal(prepareSYDValidatedDraft({plan:{screen_id:"sales_invoice"},companyId:null}).ok,false);
});
test("sales draft requires verified customer and at least one valid item line",()=>{
  const plan={screen_id:"sales_invoice",fields:[{field_id:"invoice_date",value:"2026-11-24"},{field_id:"items",value:[{item_name:"Part",qty:2,rate:10,gst_rate:18}]}]};
  const missingParty=prepareSYDValidatedDraft({plan,companyId:"co"});
  assert.equal(missingParty.ok,false);
  const valid=prepareSYDValidatedDraft({plan,companyId:"co",selectedMasters:{customers:{id:"cust1"} }});
  assert.equal(valid.ok,true);
});
test("purchase validator rejects nonpositive quantity and malformed date",()=>{
  const plan={screen_id:"purchase_invoice",fields:[{field_id:"supplier_invoice_date",value:"bad-date"},{field_id:"lines",value:[{item_name:"Raw",qty:0,rate:5}]}]};
  const result=prepareSYDValidatedDraft({plan,companyId:"co",selectedMasters:{vendors:{id:"v1"}}});
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(e=>e.includes("date")));
  assert.ok(result.errors.some(e=>e.includes("quantity")));
});
test("expense draft requires category, payee and lines",()=>{
  const plan={screen_id:"expense_entry",fields:[{field_id:"expense_date",value:"2026-11-24"},{field_id:"lines",value:[{description:"Fuel",qty:1,rate:100}]}]};
  assert.equal(prepareSYDValidatedDraft({plan,companyId:"co"}).ok,false);
  const valid=prepareSYDValidatedDraft({plan,companyId:"co",selectedMasters:{expense_categories:{id:"cat1"}}});
  assert.equal(valid.ok,true);
});
test("draft validator rejects invalid numeric fields and discounts outside range",()=>{
  const plan={screen_id:"sales_invoice",fields:[{field_id:"items",value:[{item_name:"Item",qty:1,rate:"abc",discount_percent:110}]}]};
  const result=prepareSYDValidatedDraft({plan,companyId:"co",selectedMasters:{customers:{id:"cust1"}}});
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(e=>e.includes("numeric")));
  assert.ok(result.errors.some(e=>e.includes("discount")));
});
