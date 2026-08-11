export type UserRole = "super_admin" | "admin";

/** Roles that may appear on profiles (admin hub + public customers). */
export type ProfileRole = UserRole | "customer";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthSession = AuthUser & {
  avatarUrl: string | null;
  authenticatedAt: string;
};

export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    label: string;
    description: string;
    routes: string[];
    canInvite: boolean;
    /** Can suspend / unsuspend Admin accounts. */
    canBlockAdmins: boolean;
  }
> = {
  super_admin: {
    label: "Super Admin",
    description:
      "Full system access. Dispatches invitations, assigns roles, and can block Admin or Customer accounts.",
    routes: [
      "/dashboard",
      "/orders",
      "/products",
      "/qas",
      "/users",
      "/settings",
    ],
    canInvite: true,
    canBlockAdmins: true,
  },
  admin: {
    label: "Admin",
    description:
      "Operational access to catalog, orders, and settings. Cannot invite or block users.",
    routes: [
      "/dashboard",
      "/orders",
      "/products",
      "/qas",
      "/users",
      "/settings",
    ],
    canInvite: false,
    canBlockAdmins: false,
  },
};

export function canAccessRoute(role: UserRole, pathname: string) {
  if (pathname.startsWith("/api/")) return true;
  const allowed = ROLE_PERMISSIONS[role].routes;
  return allowed.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canInviteUsers(role: UserRole) {
  return ROLE_PERMISSIONS[role].canInvite;
}

export function canBlockAdmins(role: UserRole) {
  return ROLE_PERMISSIONS[role].canBlockAdmins;
}

/** Whether `actor` may suspend/unsuspend a user with `targetRole`. */
export function canBlockUser(actor: UserRole, targetRole: ProfileRole | UserRole) {
  // Only Super Admins can block, and never other Super Admins.
  if (actor !== "super_admin") return false;
  if (!canBlockAdmins(actor)) return false;
  return targetRole === "admin" || targetRole === "customer";
}

export function parseRole(value: unknown): UserRole {
  if (value === "super_admin" || value === "admin") {
    return value;
  }
  // Legacy operator accounts map to admin access until migrated
  if (value === "operator") return "admin";
  // Unknown / customer / null are not staff — callers must not treat this as access grant.
  // Default to admin only for session fallbacks where a logged-in dashboard user is expected.
  return "admin";
}

/** Normalize a stored role for display in Settings (does not grant access). */
export function parseProfileRole(value: unknown): ProfileRole {
  if (value === "super_admin" || value === "admin" || value === "customer") {
    return value;
  }
  if (value === "operator") return "admin";
  return "customer";
}

/** True when the value is an admin-hub staff role (not customer/public). */
export function isStaffRole(value: unknown): value is UserRole {
  return value === "super_admin" || value === "admin" || value === "operator";
}

export function roleLabel(role: UserRole) {
  return ROLE_PERMISSIONS[role].label;
}
