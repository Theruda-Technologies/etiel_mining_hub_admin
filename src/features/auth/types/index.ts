export type UserRole = "super_admin" | "admin";

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
      "Full system access. Dispatches invitations, assigns roles, and can block Admin accounts.",
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
export function canBlockUser(actor: UserRole, targetRole: UserRole) {
  // Only Super Admins can block, and only Admin accounts (not other Super Admins).
  if (actor !== "super_admin") return false;
  if (!canBlockAdmins(actor)) return false;
  if (targetRole !== "admin") return false;
  return true;
}

export function parseRole(value: unknown): UserRole {
  if (value === "super_admin" || value === "admin") {
    return value;
  }
  // Legacy operator accounts map to admin access until migrated
  if (value === "operator") return "admin";
  return "admin";
}

export function roleLabel(role: UserRole) {
  return ROLE_PERMISSIONS[role].label;
}
