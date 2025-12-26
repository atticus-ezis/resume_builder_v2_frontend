"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/app/api";

type AuthContextType = {
  isVerified: boolean | null;
  authorizeUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const fetchUser = async () => {
    try {
      const response = await api.get("/api/accounts/me/");
      console.log("Auth Context response:", response);
      setIsVerified(true);
    } catch (err: any) {
      console.log("Auth Context error:", err);
      if (err.response?.status === 401) {
        setIsVerified(false);
      } else {
        setIsVerified(false);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return <AuthContext.Provider value={{ isVerified, authorizeUser: fetchUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
