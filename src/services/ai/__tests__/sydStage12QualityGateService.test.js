import test from "node:test";
import assert from "node:assert/strict";
import { SYD_STAGE12_CHECKS, summarizeSYDStage12Checks } from "../sydStage12QualityGateService.js";

test("Stage 12 quality gate defines a stable checklist",()=>{
  assert.equal(SYD_STAGE12_CHECKS.length,15);
  assert.ok(SYD_STAGE12_CHECKS.some(check=>check.id==="company_isolation"));
  assert.ok(SYD_STAGE12_CHECKS.some(check=>check.id==="authorization_expiry"));
});
test("quality gate defaults all checks to not_run and incomplete",()=>{
  const summary=summarizeSYDStage12Checks();
  assert.equal(summary.readiness,"incomplete");
  assert.equal(summary.notRun,15);
  assert.equal(summary.percentage,0);
});
test("quality gate counts pass/fail/block and never treats untested checks as passed",()=>{
  const summary=summarizeSYDStage12Checks({company_context:"passed",company_isolation:"passed",ci_build:"failed",handoff:"blocked"});
  assert.equal(summary.passed,2);
  assert.equal(summary.failed,1);
  assert.equal(summary.blocked,1);
  assert.equal(summary.notRun,11);
  assert.equal(summary.readiness,"failed");
  assert.equal(summary.percentage,13);
});
test("all checklist entries can be marked passed to reach ready",()=>{
  const results=Object.fromEntries(SYD_STAGE12_CHECKS.map(check=>[check.id,"passed"]));
  assert.equal(summarizeSYDStage12Checks(results).readiness,"ready");
});
