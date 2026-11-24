/**
 * Stage 10 — Guided conversational transaction orchestration.
 * This module derives workflow state from user-confirmed workspace actions.
 * It never performs database writes, posting, or external side effects.
 */
const SUPPORTED = new Set(["sales_invoice","purchase_invoice","expense_entry"]);
export function deriveSYDTransactionOrchestration({plan,companyId,masterResults=[],selectedMasters={},selectedLineItems={},draftReviewOpen=false,preparedDraft=null,contextAnalysis=null}={}) {
  const supported=SUPPORTED.has(plan?.screen_id);
  const lineMasterResults=masterResults.filter(r=>r.lineIndex!==undefined);
  const headerMasterResults=masterResults.filter(r=>r.lineIndex===undefined);
  const requiredMasterType=plan?.screen_id==="sales_invoice"?"customers":plan?.screen_id==="purchase_invoice"||plan?.screen_id==="expense_entry"?"vendors":null;
  const partyVerified=!!(requiredMasterType&&selectedMasters[requiredMasterType]?.id);
  const lineMasterCoverage=lineMasterResults.length===0?null:lineMasterResults.every(r=>r.candidates?.length===0||!!selectedLineItems[r.lineIndex]?.id);
  const lookupComplete=masterResults.length>0;
  const validated=!!preparedDraft?.ok;
  const stages=[
    {id:"interpret",label:"Review transaction request",status:plan?"complete":"pending",detail:plan?"SYD has interpreted the current request. Review the proposal.":"Submit a transaction request to SYD."},
    {id:"company",label:"Confirm company context",status:companyId?"complete":"blocked",detail:companyId?"Company context is available.":"Select a company before proceeding."},
    {id:"masters",label:"Verify party and item masters",status:!supported?"blocked":partyVerified&&lineMasterCoverage!==false?"complete":lookupComplete?"attention":"pending",detail:!supported?"Guided orchestration is enabled only for audited invoice/expense screens.":partyVerified&&lineMasterCoverage!==false?"Party master confirmed and item matches reviewed where applicable.":"Run the read-only master lookup and select verified matches."},
    {id:"review",label:"Review and correct draft",status:!supported?"blocked":draftReviewOpen?"active":"pending",detail:"Review header and line details. Corrections remain local to this proposal."},
    {id:"validate",label:"Validate draft",status:validated?"complete":!supported?"blocked":"pending",detail:validated?"Draft validation passed.":"Run deterministic validation before form handoff."},
    {id:"handoff",label:"Open target form",status:validated?"ready":"blocked",detail:validated?"The validated draft can be handed to the supported form.":"Available after successful draft validation."},
  ];
  const activeStage=stages.find(s=>s.status==="active")||stages.find(s=>s.status==="attention")||stages.find(s=>s.status==="pending")||stages.find(s=>s.status==="ready")||stages.find(s=>s.status==="blocked");
  let nextAction="Submit or review the interpreted request";
  let actionId="interpret";
  if(plan&&supported&&!companyId){nextAction="Select a company";actionId="company";}
  else if(plan&&supported&&!lookupComplete){nextAction="Run read-only master lookup";actionId="masters";}
  else if(plan&&supported&&!partyVerified){nextAction="Select the verified party master";actionId="masters";}
  else if(plan&&supported&&lineMasterCoverage===false){nextAction="Select verified item matches";actionId="masters";}
  else if(plan&&supported&&!draftReviewOpen){nextAction="Open draft review";actionId="review";}
  else if(plan&&supported&&!validated){nextAction="Validate draft";actionId="validate";}
  else if(validated){nextAction="Open target form";actionId="handoff";}
  return {supported,stages,activeStage:activeStage?.id||null,nextAction,actionId,progress:stages.filter(s=>s.status==="complete").length,total:stages.length,blockedReason:!supported?"This transaction screen is not supported by the guided draft workflow.":!companyId?"Select a company to continue.":contextAnalysis?.questions?.length? "Clarifications are available; review them before validating.":null};
}
