"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type UserRole = "admin" | "manager" | "staff" | "contributor" | "member";

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
}

const mockUsers: Record<UserRole, User> = {
  admin: { id: "1", firstName: "Admin", lastName: "User", email: "admin@kingdom.edu", role: "admin", roleName: "Administrator" },
  manager: { id: "2", firstName: "Manager", lastName: "User", email: "manager@kingdom.edu", role: "manager", roleName: "Manager" },
  staff: { id: "3", firstName: "Staff", lastName: "User", email: "staff@kingdom.edu", role: "staff", roleName: "Staff" },
  contributor: { id: "4", firstName: "Contributor", lastName: "User", email: "contributor@kingdom.edu", role: "contributor", roleName: "Contributor" },
  member: { id: "5", firstName: "John", lastName: "Doe", email: "john@kingdom.edu", role: "member", roleName: "Kingdom Member" },
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
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("kcs_user");
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const u = mockUsers[role];
    setUser(u);
    localStorage.setItem("kcs_user", JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
