/**
 * Privacy-conscious AI telemetry contract.
 * Never include raw voice recordings, transcripts, PAN, GSTIN, bank data or
 * full form payloads in telemetry events.
 */
export function createSYDAIUsageEvent({
  requestId, model, platform, intent, usage, status = "completed",
}) {
  return Object.freeze({
    eventType: "syd_ai_usage",
    requestId: requestId || null,
    model: model || null,
    platform: ["web","android","ios"].includes(platform) ? platform : "unknown",
    intent: intent || "unknown",
    inputTokens: Number.isFinite(usage?.inputTokens) ? usage.inputTokens : null,
    outputTokens: Number.isFinite(usage?.outputTokens) ? usage.outputTokens : null,
    totalTokens: Number.isFinite(usage?.totalTokens) ? usage.totalTokens : null,
    status,
    occurredAt: new Date().toISOString(),
  });
}

export function createSYDAIErrorEvent({ requestId, platform, stage, errorCode }) {
  return Object.freeze({
    eventType: "syd_ai_error",
    requestId: requestId || null,
    platform: ["web","android","ios"].includes(platform) ? platform : "unknown",
    stage: stage || "unknown",
    errorCode: errorCode || "unspecified",
    occurredAt: new Date().toISOString(),
  });
}
