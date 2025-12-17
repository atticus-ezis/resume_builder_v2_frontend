"use client";

import { useEffect, useState } from "react";

export default function Registration() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const register_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/registration/";
  console.log("This is the endpoint: " + register_endpoint);

  async function registerUser() {
    const response = await fetch(register_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "",
        email: "test@gmail.com",
        password1: "skippy123",
        password2: "skippy123",
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.log("This is the error: " + errorData);
      setError(errorData);
    } else {
      const data = await response.json();
      console.log("This is the data: " + data);
      setResponse(data);
    }
  }

  return (
    <div>
      <div>Registration</div>
      <button onClick={registerUser}>Click Me</button>
      {error && <div>Error found: {error}</div>}
      {response ? <div>Response found: {response}</div> : <div>No response found</div>}
    </div>
  );
}
