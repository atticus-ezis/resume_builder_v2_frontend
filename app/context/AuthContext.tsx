"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/app/api";

const validate_user_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/validate-user/";

type AuthContextType = {
  isVerified: boolean | null;
  authorizeUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const response = await api.get(validate_user_endpoint);
      console.log("Auth Context response:", response);
      setIsVerified(true);
    } catch (err: any) {
      console.log("Auth Context error:", err);
      setIsVerified(false);
    }
  };

  // Run on initial mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Re-validate on route changes
  useEffect(() => {
    if (pathname) {
      fetchUser();
    }
  }, [pathname]);

  return <AuthContext.Provider value={{ isVerified, authorizeUser: fetchUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
