/**
 * SYD Intelligence — intent and command contract.
 * Model output is a proposed plan, never an executable permission grant.
 */
export const SYD_AI_INTENTS = Object.freeze(["navigate","prepare_form","answer_question","clarify","unsupported"]);
export const SYD_AI_COMMAND_TYPES = Object.freeze(["navigation","master","sales","purchase","expense","receipt","payment","accounting","report","general"]);
export function isSupportedAIIntent(intent) {
  return SYD_AI_INTENTS.includes(intent);
}
export function normalizeAICommandText(value) {
  const text = String(value || "").trim();
  if (!text) throw new Error("Please provide a command.");
  if (text.length > 3000) throw new Error("Command is too long. Please use 3,000 characters or fewer.");
  return text;
}
