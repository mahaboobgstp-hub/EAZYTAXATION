import { supabase } from "../../supabase/supabaseClient";
import { getSYDWebFieldKnowledge } from "../../ai/registry/webFieldKnowledge";
import { getSYDOperationalKnowledge } from "../../ai/registry/operationalKnowledge";
import {
  buildCompanyAIContext, getScreenDefinition, listScreenDefinitions,
  listFieldDefinitions, normalizeAICommandText,
} from "../../ai/registry";

/**
 * Shared web/Android/iOS entry point. The Edge Function returns a proposal only.
 */
export async function interpretSYDCommand({
  text, company, currentScreenId = null, platform = "web", conversationContext = null,
}) {
  const command = normalizeAICommandText(text);
  if (!["web","android","ios"].includes(platform)) throw new Error("Unsupported application platform.");
  const screen = currentScreenId ? getScreenDefinition(currentScreenId) : null;
  const fields = currentScreenId ? listFieldDefinitions(currentScreenId) : [];
  const registeredScreens = listScreenDefinitions().map(item => ({
    screenId: item.screenId, name: item.name, module: item.module,
    route: item.route, description: item.description,
    platformSupport: item.platformSupport,
    requiredPermissions: item.requiredPermissions,
    companyRequirements: item.companyRequirements,
    fields: getSYDWebFieldKnowledge(item.screenId).map(field => ({
      fieldId: field.fieldId, label: field.label, type: field.type,
      required: field.required, description: field.description,
      options: field.options, validation: field.validation,
    })),
  }));

  const { data, error } = await supabase.functions.invoke("syd-ai-intelligence", {
    body: {
      command, platform, companyContext: buildCompanyAIContext(company),
      operationalKnowledge: getSYDOperationalKnowledge(),
      registeredScreens,
      currentScreen: screen ? {
        screenId: screen.screenId, name: screen.name, module: screen.module,
        description: screen.description, route: screen.route,
        requiredPermissions: screen.requiredPermissions,
        companyRequirements: screen.companyRequirements,
      } : null,
      fields: fields.map(field => ({
        fieldId: field.fieldId, label: field.label, type: field.type,
        required: field.required, description: field.description,
        options: field.options, validation: field.validation,
      })),
      conversationContext: conversationContext && typeof conversationContext === "object" ? conversationContext : null,
    },
  });
  if (error) throw new Error(error.message || "SYD Intelligence is temporarily unavailable.");
  if (!data?.plan) throw new Error(data?.error || "SYD Intelligence returned no action plan.");
  return data;
}
