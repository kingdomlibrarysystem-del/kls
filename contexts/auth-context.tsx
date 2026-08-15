"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { logAuditEvent } from "@/app/dashboard/audit-log/_components/use-audit-log";
import { roleNameToUserRole, type UserRole } from "@/lib/roles";

export type { UserRole };
export { roleNameToUserRole };

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  roleName: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** This device's session id — used to mark "this device" in the Sessions & Devices list. */
  currentSessionId: string | undefined;
  /** Returns `matched: false` when the credentials were rejected (wrong password, unknown email, or a missing/incorrect TOTP code) — the caller decides how to surface that. */
  login: (email: string, password: string, totpCode?: string) => Promise<{ matched: boolean }>;
  /** Checks /api/auth/2fa/login-check — call before login() to know whether to render a TOTP code field. */
  checkRequiresTotp: (email: string) => Promise<boolean>;
  logout: () => void;
  /** Merges a partial edit (e.g. name/email from a profile form) into the current user via a real PATCH, then refreshes the session. */
  updateUser: (updates: Partial<Pick<User, "firstName" | "lastName" | "email">>) => void;
  /** Creates a real member account via /api/auth/register, then signs them in immediately. */
  register: (fullName: string, email: string, password: string) => Promise<void>;
  /** Sends a real password-reset email via /api/auth/forgot-password. Always resolves (never reveals whether the email matched an account). */
  forgotPassword: (email: string) => Promise<void>;
  /** Confirms a real email-verification token via /api/auth/verify-email. */
  verifyEmail: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  const isLoading = status === "loading";
  const user: User | null = session?.user
    ? {
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email ?? "",
        role: roleNameToUserRole(session.user.roleName),
        roleName: session.user.roleName,
      }
    : null;

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    const result = await signIn("credentials", { redirect: false, email, password, totpCode });
    const matched = !!result?.ok && !result.error;
    logAuditEvent({
      actor: email,
      action: "LOGIN",
      target: "Session",
      notes: matched ? "Standard login, credentials verified." : `Login attempt for "${email}" failed — invalid credentials.`,
    });
    return { matched };
  }, []);

  const checkRequiresTotp = useCallback(async (email: string) => {
    const res = await fetch("/api/auth/2fa/login-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json().catch(() => null);
    return !!json?.data?.requiresTotp;
  }, []);

  const logout = useCallback(() => {
    if (user) {
      logAuditEvent({ actor: `${user.firstName} ${user.lastName}`, action: "LOGOUT", target: "Session", notes: "Session ended by user." });
    }
    signOut({ redirect: false });
  }, [user]);

  const updateUser = useCallback((updates: Partial<Pick<User, "firstName" | "lastName" | "email">>) => {
    if (!user) return;
    const name = [updates.firstName ?? user.firstName, updates.lastName ?? user.lastName].join(" ").trim();
    fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: updates.email }),
    }).then(() => update());
  }, [user, update]);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? "Registration failed");
    }
    await signIn("credentials", { redirect: false, email, password });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    logAuditEvent({ actor: email, action: "PASSWORD_RESET", target: email, notes: 'Reset requested via "Forgot Password" flow.' });
  }, []);

  const verifyEmail = useCallback(async (email: string, token: string) => {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? "Verification failed");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, currentSessionId: session?.sessionId, login, checkRequiresTotp, logout, updateUser, register, forgotPassword, verifyEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
