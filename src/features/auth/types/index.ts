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
  }
> = {
  super_admin: {
    label: "Super Admin",
    description:
      "Full system access. Dispatches invitations and assigns Admin or Super Admin roles.",
    routes: [
      "/dashboard",
      "/orders",
      "/products",
      "/users",
      "/settings",
    ],
    canInvite: true,
  },
  admin: {
    label: "Admin",
    description:
      "Operational access to catalog, orders, and settings. Invited by a Super Admin.",
    routes: [
      "/dashboard",
      "/orders",
      "/products",
      "/users",
      "/settings",
    ],
    canInvite: false,
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
