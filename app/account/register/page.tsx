"use client";

import { useEffect, useState } from "react";

type FormData = {
  username: string;
  email: string;
  password1: string;
  password2: string;
};

export default function Registration() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password1: "",
    password2: "",
  });

  const register_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/registration/";

  async function registerUser() {
    setError(null);
    setResponse(null);
    console.log("endpoint used:", register_endpoint);

    try {
      const response = await fetch(register_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json(); // { "username": [ "This field is required." ] }
        console.log("This is the error:", errorData);
        setError(errorData);
      } else {
        const data = await response.json();
        console.log("!!!! Success:This is the data:", data);
        setResponse(data);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError({ detail: "Network error or invalid response" });
    }
  }

  const FieldError = ({ error }: { error?: Array<any> }) => {
    if (!error?.length) return null;
    return <div style={{ color: "red" }}>{error.map((error: any) => error).join(", ")}</div>;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div>Registration</div>
      {/* Registration form */}
      <FieldError error={error?.non_field_errors} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          registerUser();
        }}
      >
        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
        <FieldError error={error?.username} />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
        <FieldError error={error?.email} />
        <input
          type="password"
          name="password1"
          value={formData.password1}
          onChange={handleChange}
          placeholder="Password"
        />
        <FieldError error={error?.password1} />
        <input
          type="password"
          name="password2"
          value={formData.password2}
          onChange={handleChange}
          placeholder="Confirm Password"
        />
        <FieldError error={error?.password2} />
        <button type="submit">Register</button>
      </form>
      {error && error.detail && <div style={{ color: "red" }}>Error: {error.detail}</div>}
      {response && (
        <div>
          <h1>Response Data</h1>
          <p>{JSON.stringify(response)}</p>
        </div>
      )}
    </div>
  );
}
