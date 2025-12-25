"use client";

import Link from "next/link";
import { api } from "@/app/api";
import { useRouter } from "next/navigation";

// determine if user is authenticated
// if authenticated, show logout
// if not authenticated, show signup / login
// logout needs to hit endpoint and redirect to homepage

export default function Navbar() {
  const router = useRouter();

  async function logoutHandler() {
    console.log("Hitting loggout endpoint");
    try {
      const response = await api.post("/api/accounts/logout/");
      console.log("raw logout response:", response);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }
  return (
    <header>
      <h1>This is the header</h1>
      <div>
        <Link href="/account/login">Login</Link>
        <Link href="/account/register">Signup</Link>
        <button onClick={logoutHandler}>Logout</button>
      </div>
    </header>
  );
}
