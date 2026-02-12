"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, TextInput, Button, Alert, Label, Spinner } from "flowbite-react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetPasswordUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/password/reset/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch(resetPasswordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const responseJson = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError(responseJson.email?.[0] || "Please enter a valid email address.");
        } else if (response.status === 500) {
          setError("Internal server error. Please try again later.");
        } else {
          setError(responseJson.detail || "An unexpected error occurred. Please try again later.");
        }
        return;
      }

      // Handle successful password reset request
      setSuccess(responseJson.detail || "Password reset e-mail has been sent.");
      setEmail(""); // Clear the form
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {error && (
            <Alert color="failure" onDismiss={() => setError(null)}>
              <span className="font-medium">Error!</span> {error}
            </Alert>
          )}

          {success && (
            <Alert color="success" onDismiss={() => setSuccess(null)}>
              <span className="font-medium">Success!</span> {success}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner aria-label="Loading" size="sm" className="mr-3" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link href="/account/login" className="text-blue-600 hover:underline dark:text-blue-500">
              Back to login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
