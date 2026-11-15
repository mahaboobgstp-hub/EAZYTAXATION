/**
 * SYD Intelligence — Planned tool/action catalogue.
 * Contracts are registered now; execution remains disabled in Phase 1.
 */
const toolCatalog = [
  {
    name: "navigate_to_screen",
    description: "Navigate to a verified SYD screen.",
    availableFromPhase: 2,
    enabled: false,
    permission: "navigation.use",
    sideEffect: "ui",
    parameters: { type: "object", additionalProperties: false, properties: { screen_id: { type: "string" } }, required: ["screen_id"] },
  },
  {
    name: "get_company_context",
    description: "Retrieve verified settings for the active company.",
    availableFromPhase: 2,
    enabled: false,
    permission: "company.read",
    sideEffect: "read",
    parameters: { type: "object", additionalProperties: false, properties: {}, required: [] },
  },
  {
    name: "search_customer",
    description: "Search customers within the active company.",
    availableFromPhase: 2,
    enabled: false,
    permission: "customers.read",
    sideEffect: "read",
    parameters: { type: "object", additionalProperties: false, properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "search_vendor",
    description: "Search vendors within the active company.",
    availableFromPhase: 2,
    enabled: false,
    permission: "vendors.read",
    sideEffect: "read",
    parameters: { type: "object", additionalProperties: false, properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "search_item",
    description: "Search items within the active company.",
    availableFromPhase: 2,
    enabled: false,
    permission: "items.read",
    sideEffect: "read",
    parameters: { type: "object", additionalProperties: false, properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "prepare_form",
    description: "Prepare a draft using verified field IDs for a registered screen.",
    availableFromPhase: 2,
    enabled: false,
    permission: "forms.prepare",
    sideEffect: "ui",
    parameters: {
      type: "object", additionalProperties: false,
      properties: {
        screen_id: { type: "string" },
        fields: { type: "array", items: {
          type: "object", additionalProperties: false,
          properties: { field_id: { type: "string" }, value: { type: ["string","null"] } },
          required: ["field_id","value"],
        } },
      },
      required: ["screen_id","fields"],
    },
  },
  {
    name: "validate_form",
    description: "Run deterministic SYD validation on a prepared form.",
    availableFromPhase: 2,
    enabled: false,
    permission: "forms.validate",
    sideEffect: "read",
    parameters: { type: "object", additionalProperties: false, properties: { screen_id: { type: "string" } }, required: ["screen_id"] },
  },
  {
    name: "save_transaction",
    description: "Save a user-approved transaction through an authorized SYD service.",
    availableFromPhase: 3,
    enabled: false,
    permission: "transactions.create",
    sideEffect: "write",
    parameters: { type: "object", additionalProperties: false, properties: { draft_id: { type: "string" }, confirmation_id: { type: "string" } }, required: ["draft_id","confirmation_id"] },
  },
];

export const SYD_AI_TOOL_CATALOG = Object.freeze(toolCatalog.map(tool => Object.freeze(tool)));
export function listSYDAITools() {
  return SYD_AI_TOOL_CATALOG;
}
export function getSYDAITool(name) {
  return SYD_AI_TOOL_CATALOG.find(tool => tool.name === name) || null;
}
export function isSYDAIToolEnabled(name) {
  const tool = getSYDAITool(name);
  return Boolean(tool?.enabled);
}
