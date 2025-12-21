"use client";

import { api } from "@/app/api";
import { useEffect, useState } from "react";

const refresh_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/token/refresh/";
``;

export default function Test() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const refreshToken = async () => {
    try {
      const response = await api.post(refresh_endpoint, {});
      setResponse(response.data);
      console.log("Response:", response.data);
    } catch (err: any) {
      console.error("Error catching:", err);
      const errMessage = err.message || "couldn't find error message";
      setError(errMessage);
    }
  };

  useEffect(() => {
    refreshToken();
  }, []);

  return (
    <div>
      <h1>Test</h1>
      {response && <p>Response: {response}</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
