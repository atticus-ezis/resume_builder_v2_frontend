"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/api";
// sample response data:
// {
//   "user": {
//       "pk": 6,
//       "username": "dumdum",
//       "email": "dum@gmail.com",
//       "first_name": "",
//       "last_name": ""
//   }
// }
// sets cookies as "refresh_token", "access_token"

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

  const register_endpoint = "/api/accounts/registration/";

  async function registerUser() {
    setError(null);
    setResponse(null);
    console.log("Registration attempted:", register_endpoint);

    try {
      const response = await api.post(register_endpoint, formData);

      setResponse(response.data);
    } catch (err: any) {
      console.error("Registration error:", err.message, "Code:", err.code, "Raw Error:", err);
      console.error("data being sent:", err.config.data);
      console.error("response:", err.response.data.detail);
      setError({ detail: [err.message, err.response.data.detail] });
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
        <input
          type="email"
          autoComplete="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <FieldError error={error?.email} />
        <input
          type="password"
          name="password1"
          autoComplete="new-password"
          value={formData.password1}
          onChange={handleChange}
          placeholder="Password"
        />
        <FieldError error={error?.password1} />
        <input
          type="password"
          name="password2"
          autoComplete="new-password"
          value={formData.password2}
          onChange={handleChange}
          placeholder="Confirm Password"
        />
        <FieldError error={error?.password2} />
        <button type="submit">Register</button>
      </form>
      {error && error.detail && (
        <div style={{ color: "red" }}>Error: {error.detail.map((error: any) => error).join(", ")}</div>
      )}
      {response && (
        <div>
          <h1>Response Data</h1>
          <p>{JSON.stringify(response)}</p>
        </div>
      )}
    </div>
  );
}
