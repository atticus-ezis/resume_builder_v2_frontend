"use client";
import { api } from "@/app/api";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function Profile() {
  const { userId } = useAuth();
  const { userEmail } = useAuth();
  async function getProfile() {
    const response = await api.get(`/api/accounts/user?id=${userId}`);
    console.log("RESPONSE DATA:", response.data);
  }

  useEffect(() => {
    getProfile();
  }, []);
  return (
    <>
      <div>Profile Page</div>
      <div>User ID: {userId}</div>
      <div>User Email: {userEmail}</div>
      <h1>Applications</h1>
      <h2>Personas</h2>
    </>
  );
}
