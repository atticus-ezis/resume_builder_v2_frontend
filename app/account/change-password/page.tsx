"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, TextInput, Button, Alert, Label, Spinner } from "flowbite-react";
import { api } from "@/app/api";

export default function ChangePassword() {
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      const response = await api.post("/api/accounts/password/change/", {
        new_password1: newPassword1,
        new_password2: newPassword2,
      });

      if (response.status === 200) {
        setSuccess(true);
        setNewPassword1("");
        setNewPassword2("");
      }
    } catch (err: any) {
      // Check if it's an axios error with response data
      if (err.response?.data) {
        const errors = [];
        if (err.response.data.new_password1) errors.push(err.response.data.new_password1[0]);
        if (err.response.data.new_password2) errors.push(err.response.data.new_password2[0]);
        setError(errors.length > 0 ? errors.join(" ") : "Failed to change password. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Password Changed!</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your password has been successfully changed.
              </p>
            </div>
            <Button as={Link} href="/account/profile" className="w-full">
              Back to Profile
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Change Password</h1>
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
                  Changing password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link href="/account/profile" className="text-blue-600 hover:underline dark:text-blue-500">
              Back to profile
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
