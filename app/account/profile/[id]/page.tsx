"use client";
import { api } from "@/app/api";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function Profile() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  console.log("ID PASSED?:", id);
  async function getProfile() {
    try {
      console.log("url endpoint:", `/api/accounts/user?id=${id}`);
      const response = await api.get(`/api/accounts/user?id=${id}`);

      console.log("RESPONSE:", response);
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
