"use client";
import { api } from "@/app/api";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function Profile() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  async function getProfile() {
    try {
      const response = await api.get(`/api/accounts/user?id=${id}`);

      console.log("RESPONSE DATA:", response.data);
    } catch (error) {
      console.error(error);
    }
  }
  useEffect(() => {
    getProfile();
  }, []);
  return <div>Profile Page</div>;
}
