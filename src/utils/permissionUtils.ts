import { getAdminFromToken } from "./authUtils";

// ─── Permission Keys ──────────────────────────────────────────────────────────

export const PERMISSIONS = {
  READ: "READ",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  EXPORT: "EXPORT",
  SEND_MAIL: "SEND_MAIL",
  VIEW_PRIVATE: "VIEW_PRIVATE",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Core Helpers ─────────────────────────────────────────────────────────────

/** Returns true when `perms` contains `key`. */
export const hasPermission = (perms: string[], key: PermissionKey): boolean =>
  perms.includes(key);

/** Returns true when `perms` contains every key in `keys`. */
export const hasAllPermissions = (
  perms: string[],
  keys: PermissionKey[],
): boolean => keys.every((k) => perms.includes(k));

/** Returns true when `perms` contains at least one key from `keys`. */
export const hasAnyPermission = (
  perms: string[],
  keys: PermissionKey[],
): boolean => keys.some((k) => perms.includes(k));

// ─── Named Checks ─────────────────────────────────────────────────────────────

export const canRead = (perms: string[]): boolean =>
  hasPermission(perms, PERMISSIONS.READ);

export const canCreate = (perms: string[]): boolean =>
  hasPermission(perms, PERMISSIONS.CREATE);

export const canUpdate = (perms: string[]): boolean =>
  hasPermission(perms, PERMISSIONS.UPDATE);

export const canDelete = (perms: string[]): boolean =>
  hasPermission(perms, PERMISSIONS.DELETE);

export const canExport = (perms: string[]): boolean =>
  hasPermission(perms, PERMISSIONS.EXPORT);

export const canSendMail = (perms: string[]): boolean =>
  hasPermission(perms, PERMISSIONS.SEND_MAIL);

export const canViewPrivate = (perms: string[]): boolean =>
  hasPermission(perms, PERMISSIONS.VIEW_PRIVATE);

// ─── Token-Based Checks ───────────────────────────────────────────────────────

/** Reads permissions from the current admin JWT and returns them as a string[]. */
export const getPermissionsFromToken = (): string[] => {
  const user = getAdminFromToken();
  if (!user?.permission) return [];
  return Array.isArray(user.permission) ? user.permission : [user.permission];
};

/** Checks a single permission against the current JWT. */
export const currentUserCan = (key: PermissionKey): boolean =>
  hasPermission(getPermissionsFromToken(), key);
