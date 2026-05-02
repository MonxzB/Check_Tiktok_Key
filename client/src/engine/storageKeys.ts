// ============================================================
// engine/storageKeys.ts — Workspace-scoped localStorage key factory
// Prevents workspace A's data from leaking into workspace B
// ============================================================

/**
 * Returns a localStorage key scoped to the active workspace.
 * Falls back to 'default' when workspaceId is null/undefined
 * (e.g. before auth or when using offline mode).
 *
 * Pattern: `ytlf_<key>_ws_<workspaceId>`
 *
 * @example
 *   wsKey('active_tab', 'abc123') → 'ytlf_active_tab_ws_abc123'
 *   wsKey('active_tab', null)     → 'ytlf_active_tab_ws_default'
 */
export function wsKey(key: string, workspaceId: string | null | undefined): string {
  const scope = workspaceId ?? 'default';
  return `ytlf_${key}_ws_${scope}`;
}

/**
 * Global (user-level) key — not workspace-scoped.
 * Use for settings, personal weights, quota data that should
 * persist across workspaces.
 */
export function globalKey(key: string): string {
  return `ytlf_${key}`;
}
