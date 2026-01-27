// Login steps:
// Create a form with user info to pass to API
// handle response, display errors or redirect to profile page
// csrf and credentials not needed
// export function

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, TextInput, Button, Alert, Label, Spinner } from "flowbite-react";

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/login/";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(login_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginForm),
      });

      const responseJson = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError(responseJson.non_field_errors?.[0] || "Invalid credentials. Please try again.");
        } else if (response.status === 500) {
          setError("Internal server error. Please try again later.");
        } else {
          setError(responseJson.detail || "An unexpected error occurred. Please try again later.");
        }
        return;
      }

      // Handle successful login
      if (responseJson.user?.pk) {
        router.push(`/account/profile/${responseJson.user.pk}`);
      } else {
        setError("Login successful but user data is missing.");
        console.log("responseJson:", responseJson);
        return;
      }
    } catch (err: any) {
      setError("Network error: Check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <Alert color="failure" onDismiss={() => setError(null)}>
              <span className="font-medium">Error!</span> {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Your email</Label>
              <TextInput
                id="email"
                type="email"
                name="email"
                placeholder="name@company.com"
                required
                value={loginForm.email}
                onChange={handleChange}
                autoComplete="email"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Your password</Label>
              <TextInput
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                value={loginForm.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner aria-label="Loading" size="sm" className="mr-3" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
