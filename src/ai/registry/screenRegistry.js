/**
 * SYD Intelligence — Screen Registry.
 * Register a screen only after its route and behavior have been verified.
 */
const screens = new Map();
const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export function registerScreenDefinition(definition, { replace = false } = {}) {
  if (!definition || typeof definition !== "object") throw new TypeError("A screen definition is required.");
  const screenId = String(definition.screenId || "").trim();
  const route = String(definition.route || "").trim();
  const name = String(definition.name || "").trim();
  if (!ID_PATTERN.test(screenId)) throw new Error("screenId must use lowercase letters, numbers and underscores.");
  if (!route.startsWith("/app/") && route !== "/app") throw new Error("Registered application routes must start with /app.");
  if (!name) throw new Error("A screen name is required.");
  if (screens.has(screenId) && !replace) throw new Error(`Screen "${screenId}" is already registered.`);

  const normalized = Object.freeze({
    screenId, name, module: String(definition.module || "General"), route,
    description: String(definition.description || ""),
    platformSupport: Object.freeze([...(definition.platformSupport || ["web", "android", "ios"])]),
    requiredPermissions: Object.freeze([...(definition.requiredPermissions || [])]),
    companyRequirements: Object.freeze({ ...(definition.companyRequirements || {}) }),
    status: definition.status || "active",
  });
  screens.set(screenId, normalized);
  return normalized;
}

export function getScreenDefinition(screenId) {
  return screens.get(String(screenId || "")) || null;
}
export function listScreenDefinitions() {
  return Array.from(screens.values());
}
export function removeScreenDefinition(screenId) {
  return screens.delete(String(screenId || ""));
}
