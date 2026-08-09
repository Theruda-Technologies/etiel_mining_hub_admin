export { LoginForm } from "./components/login-form";
export { useAuthUser } from "./hooks/use-auth-user";
export { signInWithPassword, signOut } from "./api/auth";
export type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  UserRole,
} from "./types";
export {
  ROLE_PERMISSIONS,
  canAccessRoute,
  canBlockAdmins,
  canBlockUser,
  canInviteUsers,
  parseRole,
  roleLabel,
} from "./types";

// Server-only helpers: import from "@/features/auth/lib/server" in Server Components / route handlers.
