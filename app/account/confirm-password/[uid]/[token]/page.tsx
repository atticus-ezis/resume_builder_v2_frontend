"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Card, TextInput, Button, Alert, Label, Spinner } from "flowbite-react";

type Props = {
  params: Promise<{ uid: string; token: string }>;
};

export default function ConfirmPassword({ params }: Props) {
  const { uid, token } = use(params);
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const confirmPasswordUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/password/reset/confirm/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Client-side validation
    if (newPassword1 !== newPassword2) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword1.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(confirmPasswordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          new_password1: newPassword1,
          new_password2: newPassword2,
          uid: uid,
          token: token,
        }),
      });

      const responseJson = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          // Handle validation errors
          const errors = [];
          if (responseJson.new_password1) errors.push(responseJson.new_password1[0]);
          if (responseJson.new_password2) errors.push(responseJson.new_password2[0]);
          if (responseJson.token) errors.push("Invalid or expired reset link.");
          if (responseJson.uid) errors.push("Invalid user.");
          
          setError(errors.length > 0 ? errors.join(" ") : "Failed to reset password. Please try again.");
        } else if (response.status === 500) {
          setError("Internal server error. Please try again later.");
        } else {
          setError(responseJson.detail || "An unexpected error occurred. Please try again later.");
        }
        return;
      }

      // Handle successful password reset
      setSuccess(true);
      setNewPassword1("");
      setNewPassword2("");
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Password Reset Successful!</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
            </div>
            <Button as={Link} href="/account/login" className="w-full">
              Go to Login
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Set New Password</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your new password below
            </p>
          </div>

          {error && (
            <Alert color="failure" onDismiss={() => setError(null)}>
              <span className="font-medium">Error!</span> {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="new_password1">New Password</Label>
              <TextInput
                id="new_password1"
                type="password"
                name="new_password1"
                placeholder="••••••••"
                required
                value={newPassword1}
                onChange={(e) => setNewPassword1(e.target.value)}
                autoComplete="new-password"
                className="mt-1"
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="new_password2">Confirm New Password</Label>
              <TextInput
                id="new_password2"
                type="password"
                name="new_password2"
                placeholder="••••••••"
                required
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                autoComplete="new-password"
                className="mt-1"
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner aria-label="Loading" size="sm" className="mr-3" />
                  Resetting password...
                </>
              ) : (
                "Reset Password"
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
