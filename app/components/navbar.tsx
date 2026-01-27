"use client";

import Link from "next/link";
import { api } from "@/app/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { isVerified } = useAuth();
  console.log("isVerified:", isVerified);

  async function logoutHandler() {
    try {
      const response = await api.post("/api/accounts/logout/");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }
  return (
    <header>
      <h1>This is the header</h1>
      <div>
        {isVerified ? (
          <button onClick={logoutHandler}>Logout</button>
        ) : (
          <div>
            <Link href="/account/login">Login</Link>
            <Link href="/account/register">Signup</Link>
          </div>
        )}
      </div>
    </header>
  );
}
