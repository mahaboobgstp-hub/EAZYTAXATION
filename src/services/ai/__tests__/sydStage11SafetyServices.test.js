import test from "node:test";
import assert from "node:assert/strict";
import { classifySYDAction } from "../sydActionPermissionService.js";
import { evaluateSYDActionSafety } from "../sydActionSafetyService.js";
import { fingerprintSYDAction, createSYDActionAuthorization, verifySYDActionAuthorization } from "../sydActionAuthorizationService.js";
import { createSYDActionLifecycle, transitionSYDActionLifecycle } from "../sydActionLifecycleService.js";

test("permission levels map read, handoff, financial and unknown actions conservatively",()=>{
  assert.equal(classifySYDAction("lookup").level,0);
  assert.equal(classifySYDAction("form_handoff").level,3);
  assert.equal(classifySYDAction("payment").level,5);
  assert.equal(classifySYDAction("unknown_future_action").level,6);
});
test("safety rejects missing company and fingerprint",()=>{
  const safety=evaluateSYDActionSafety({action:{actionType:"read"},companyId:null});
  assert.equal(safety.safe,false);
  assert.ok(safety.issues.length>=2);
});
test("safety blocks company mismatch and unvalidated writes",()=>{
  const action={actionType:"save",companyId:"A",permission:classifySYDAction("save"),fingerprint:"f"};
  const safety=evaluateSYDActionSafety({action,companyId:"B",currentCompanyId:"B",preparedDraft:{ok:false}});
  assert.equal(safety.safe,false);
  assert.ok(safety.issues.some(issue=>issue.includes("does not match")));
  assert.ok(safety.issues.some(issue=>issue.includes("validated draft")));
});
test("authorization is action/company/fingerprint scoped and expires",()=>{
  const action={actionType:"form_handoff",companyId:"co1",fingerprint:"exact-action"};
  const safety={safe:true,issues:[]};
  const created=createSYDActionAuthorization({action,safety,approved:true,now:100,ttlMs:50});
  assert.equal(created.ok,true);
  assert.equal(verifySYDActionAuthorization({grant:created.grant,action,companyId:"co1",now:120}).ok,true);
  assert.equal(verifySYDActionAuthorization({grant:created.grant,action,companyId:"co2",now:120}).ok,false);
  assert.equal(verifySYDActionAuthorization({grant:created.grant,action:{...action,fingerprint:"changed"},companyId:"co1",now:120}).ok,false);
  assert.equal(verifySYDActionAuthorization({grant:created.grant,action,companyId:"co1",now:151}).ok,false);
});
test("authorization cannot be created without approval and safe proposal",()=>{
  assert.equal(createSYDActionAuthorization({action:{fingerprint:"x"},safety:{safe:true},approved:false}).ok,false);
  assert.equal(createSYDActionAuthorization({action:{fingerprint:"x"},safety:{safe:false},approved:true}).ok,false);
});
test("lifecycle accepts intended transitions and rejects invalid ones",()=>{
  const action={actionType:"form_handoff"};
  const state=createSYDActionLifecycle(action,{safe:true,issues:[]});
  assert.equal(state.status,"awaiting_approval");
  const approved=transitionSYDActionLifecycle(state,"authorized");
  assert.equal(approved.ok,true);
  const executing=transitionSYDActionLifecycle(approved.state,"executing");
  assert.equal(executing.ok,true);
  const done=transitionSYDActionLifecycle(executing.state,"completed");
  assert.equal(done.ok,true);
  assert.equal(transitionSYDActionLifecycle(done.state,"executing").ok,false);
});
test("stable fingerprint helper is deterministic for object key ordering",()=>{
  assert.equal(fingerprintSYDAction({a:1,b:2}),fingerprintSYDAction({b:2,a:1}));
});
