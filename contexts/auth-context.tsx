"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { logAuditEvent } from "@/app/dashboard/audit-log/_components/use-audit-log";

export type UserRole = "admin" | "manager" | "staff" | "contributor" | "member" | "lecturer";

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  /** Merges a partial edit (e.g. name/email from a profile form) into the current user and persists it, same as login/switchRole. */
  updateUser: (updates: Partial<Pick<User, "firstName" | "lastName" | "email">>) => void;
  /** Creates a new mock member account and logs them in immediately, same as login. */
  register: (fullName: string, email: string, _password: string) => Promise<void>;
  /** Simulates sending a reset email — no real email/token flow exists to model, so this just resolves after a delay. */
  forgotPassword: (email: string) => Promise<void>;
  /** Simulates confirming a verification token — resolves after a delay, no real token check. */
  verifyEmail: (token: string) => Promise<void>;
}

const mockUsers: Record<UserRole, User> = {
  admin: { id: "1", firstName: "Admin", lastName: "User", email: "admin@kingdom.edu", role: "admin", roleName: "Administrator" },
  manager: { id: "2", firstName: "Manager", lastName: "User", email: "manager@kingdom.edu", role: "manager", roleName: "Manager" },
  staff: { id: "3", firstName: "Staff", lastName: "User", email: "staff@kingdom.edu", role: "staff", roleName: "Staff" },
  contributor: { id: "4", firstName: "Contributor", lastName: "User", email: "contributor@kingdom.edu", role: "contributor", roleName: "Contributor" },
  member: { id: "5", firstName: "John", lastName: "Doe", email: "john@kingdom.edu", role: "member", roleName: "Kingdom Member" },
  /** Reuses "Dr. Elias Nkubito" — already the instructor name shown on every course card — for continuity with the identity a member already sees. */
  lecturer: { id: "6", firstName: "Dr. Elias", lastName: "Nkubito", email: "lecturer@kingdom.edu", role: "lecturer", roleName: "Lecturer" },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("kcs_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const found = Object.values(mockUsers).find((u) => u.email === email);
    const u = found ?? mockUsers.member;
    setUser(u);
    localStorage.setItem("kcs_user", JSON.stringify(u));
    logAuditEvent({ actor: `${u.firstName} ${u.lastName}`, action: "LOGIN", target: "Session", notes: "Standard login, no prior failed attempts." });
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    if (user) {
      logAuditEvent({ actor: `${user.firstName} ${user.lastName}`, action: "LOGOUT", target: "Session", notes: "Session ended by user." });
    }
    setUser(null);
    localStorage.removeItem("kcs_user");
  }, [user]);

  const switchRole = useCallback((role: UserRole) => {
    const u = mockUsers[role];
    setUser(u);
    localStorage.setItem("kcs_user", JSON.stringify(u));
  }, []);

  const updateUser = useCallback((updates: Partial<Pick<User, "firstName" | "lastName" | "email">>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem("kcs_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const register = useCallback(async (fullName: string, email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const u: User = { id: crypto.randomUUID(), firstName: firstName || fullName, lastName: rest.join(" "), email, role: "member", roleName: "Kingdom Member" };
    setUser(u);
    localStorage.setItem("kcs_user", JSON.stringify(u));
    setIsLoading(false);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await new Promise((r) => setTimeout(r, 300));
    logAuditEvent({ actor: email, action: "PASSWORD_RESET", target: email, notes: 'Reset requested via "Forgot Password" flow.' });
  }, []);

  const verifyEmail = useCallback(async (_token: string) => {
    await new Promise((r) => setTimeout(r, 300));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, switchRole, updateUser, register, forgotPassword, verifyEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
