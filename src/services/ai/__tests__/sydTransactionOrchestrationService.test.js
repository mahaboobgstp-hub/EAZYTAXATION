import test from "node:test";
import assert from "node:assert/strict";
import { deriveSYDTransactionOrchestration } from "../sydTransactionOrchestrationService.js";

test("unsupported screens are explicitly marked unsupported",()=>{
  const result=deriveSYDTransactionOrchestration({plan:{screen_id:"banking"},companyId:"co"});
  assert.equal(result.supported,false);
  assert.ok(result.stages.some(stage=>stage.status==="blocked"));
});
test("missing company blocks the guided workflow",()=>{
  const result=deriveSYDTransactionOrchestration({plan:{screen_id:"sales_invoice"}});
  assert.equal(result.actionId,"company");
});
test("validated proposal progresses to form handoff action",()=>{
  const plan={screen_id:"expense_entry"};
  const result=deriveSYDTransactionOrchestration({plan,companyId:"co",masterResults:[{candidates:[{id:"x"}]}],selectedMasters:{vendors:{id:"vendor1"},expense_categories:{id:"cat"}},draftReviewOpen:true,preparedDraft:{ok:true},contextAnalysis:{supported:true,questions:[]}});
  assert.equal(result.actionId,"handoff");
  assert.equal(result.stages.find(stage=>stage.id==="validate").status,"complete");
});
