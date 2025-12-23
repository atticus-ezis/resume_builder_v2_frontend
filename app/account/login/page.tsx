"use client";
import { useState } from "react";
import { api } from "@/app/api";
import { useRouter } from "next/navigation";

type LoginForm = {
  username: string;
  email: string;
  password: string;
};

export default function Login() {
  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const router = useRouter();

  const login_endpoint = "/api/accounts/login/";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  async function loginUser() {
    setError(null);
    setResponse(null);
    console.log("Login attempted:", login_endpoint);

    try {
      const response = await api.post(login_endpoint, loginForm);
      console.log("success!", response);
      setResponse(response.data);

      router.push(`/account/profile/${response.data.user.id}`);
    } catch (err: any) {
      console.error("Login error:", err.message, "Code:", err.code, "Raw Error:", err);
      console.error("response:", err.response?.data);
      if (err.response?.data) {
        setError(err.response.data);
      } else if (err.message) {
        setError({ detail: err.message });
      } else {
        setError({ detail: "An unexpected error occurred" });
      }
    }
  }

  const FieldError = ({ error }: { error?: Array<any> | string }) => {
    if (!error) return null;
    // Handle both array and string formats
    const errorArray = Array.isArray(error) ? error : [error];
    if (errorArray.length === 0) return null;
    return <div style={{ color: "red" }}>{errorArray.join(", ")}</div>;
  };

  return (
    <div>
      <div>Login</div>
      {/* Display general/non-field errors */}
      <FieldError error={error?.non_field_errors} />
      {error && error.detail && (
        <div style={{ color: "red" }}>
          Error: {Array.isArray(error.detail) ? error.detail.join(", ") : error.detail}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loginUser();
        }}
      >
        <input type="text" name="username" value={loginForm.username} onChange={handleChange} placeholder="Username" />
        <FieldError error={error?.username} />
        <input type="email" name="email" value={loginForm.email} onChange={handleChange} placeholder="Email" />
        <FieldError error={error?.email} />
        <input
          type="password"
          name="password"
          value={loginForm.password}
          onChange={handleChange}
          placeholder="Password"
        />
        <FieldError error={error?.password} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
