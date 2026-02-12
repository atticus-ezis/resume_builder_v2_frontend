"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, TextInput, Button, Alert, Label, Spinner } from "flowbite-react";

export default function ResendEmail() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailFromUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resendEmailUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/registration/resend-email/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(resendEmailUrl, {
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

      // Handle successful resend
      setSuccess(true);
    } catch (err: any) {
      setError("Network error: Check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Sent!</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Verification email has been sent to <span className="font-medium">{email}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please check your inbox and click the verification link.
              </p>
            </div>
            <Button as={Link} href="/account/login" className="w-full">
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resend Verification Email</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address to receive a new verification link
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
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
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
