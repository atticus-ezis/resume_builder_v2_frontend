"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/app/api";

const validate_user_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/validate-user/";

type AuthContextType = {
  isVerified: boolean | null;
  userEmail: string | null;
  userId: string | null;
  authorizeUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const response = await api.get(validate_user_endpoint);
      setIsVerified(true);
      // Safely access response data
      if (response.data) {
        setUserEmail(response.data.email || null);
        setUserId(response.data.id || null);
      }
    } catch (err: any) {
      setIsVerified(false);
      setUserEmail(null);
      setUserId(null);
      // Don't show toast for auth errors - they're expected when not logged in
    }
  };

  // Run on initial mount and re-validate on route changes
  useEffect(() => {
    fetchUser();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ isVerified, userEmail, userId, authorizeUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
