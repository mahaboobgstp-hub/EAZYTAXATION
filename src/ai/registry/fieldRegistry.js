/**
 * SYD Intelligence — Field Registry.
 * Stable field IDs are application contracts; visible labels may change.
 */
const fieldsByScreen = new Map();
const FIELD_TYPES = new Set(["text","number","currency","date","boolean","select","lookup","textarea","item_list","address","phone","email"]);
const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export function registerFieldDefinitions(screenId, definitions, { replace = false } = {}) {
  const normalizedScreenId = String(screenId || "").trim();
  if (!ID_PATTERN.test(normalizedScreenId)) throw new Error("A valid screenId is required.");
  if (!Array.isArray(definitions)) throw new TypeError("Field definitions must be an array.");
  if (fieldsByScreen.has(normalizedScreenId) && !replace) throw new Error(`Fields for "${normalizedScreenId}" are already registered.`);

  const fieldMap = new Map();
  for (const field of definitions) {
    const fieldId = String(field?.fieldId || "").trim();
    if (!ID_PATTERN.test(fieldId)) throw new Error("Every field requires a valid fieldId.");
    if (!FIELD_TYPES.has(field.type)) throw new Error(`Unsupported field type for "${fieldId}".`);
    if (fieldMap.has(fieldId)) throw new Error(`Duplicate fieldId "${fieldId}".`);
    fieldMap.set(fieldId, Object.freeze({
      fieldId, label: String(field.label || fieldId), type: field.type,
      required: Boolean(field.required), description: String(field.description || ""),
      options: Array.isArray(field.options) ? Object.freeze([...field.options]) : [],
      validation: Object.freeze({ ...(field.validation || {}) }),
      databaseColumn: field.databaseColumn ? String(field.databaseColumn) : null,
      sensitive: Boolean(field.sensitive),
    }));
  }
  fieldsByScreen.set(normalizedScreenId, fieldMap);
  return listFieldDefinitions(normalizedScreenId);
}

export function getFieldDefinition(screenId, fieldId) {
  return fieldsByScreen.get(String(screenId || ""))?.get(String(fieldId || "")) || null;
}
export function listFieldDefinitions(screenId) {
  return Array.from(fieldsByScreen.get(String(screenId || ""))?.values() || []);
}
export function validateFieldValues(screenId, values = {}) {
  const definitions = fieldsByScreen.get(String(screenId || ""));
  if (!definitions) return { valid: false, errors: ["Screen fields are not registered."] };
  const errors = [];
  for (const definition of definitions.values()) {
    const value = values[definition.fieldId];
    if (definition.required && (value === undefined || value === null || value === "")) errors.push(`${definition.label} is required.`);
    if (value !== undefined && value !== null && value !== "") {
      if (definition.type === "number" || definition.type === "currency") {
        const number = Number(value);
        if (!Number.isFinite(number)) errors.push(`${definition.label} must be a valid number.`);
        if (typeof definition.validation.min === "number" && number < definition.validation.min) errors.push(`${definition.label} must be at least ${definition.validation.min}.`);
        if (typeof definition.validation.max === "number" && number > definition.validation.max) errors.push(`${definition.label} must not exceed ${definition.validation.max}.`);
      }
      if (definition.type === "select" && definition.options.length && !definition.options.includes(value)) errors.push(`${definition.label} contains an unsupported selection.`);
    }
  }
  return { valid: errors.length === 0, errors };
}
