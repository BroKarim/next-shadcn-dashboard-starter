/**
 * Permission seam for BPK finding mutations.
 *
 * The overview and detail views are still dummy-data driven, so the manage
 * actions stay disabled. When the RBAC work lands (task_plan.md Phase 5) this
 * is replaced by the real server/client role check — `canManageFindings`
 * becomes the result of reading the signed-in user's application role.
 */
export const canManageFindings = false;

export const MANAGE_ACTIONS_DISABLED_REASON =
  'Aksi pengelolaan temuan memerlukan hak akses yang belum disiapkan pada tahap ini.';
