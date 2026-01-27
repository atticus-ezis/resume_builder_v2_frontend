"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Alert, Spinner } from "flowbite-react";

export default function VerifyEmail() {
  const [responseStatus, setResponseStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const { key } = useParams();
  const router = useRouter();
  const decodedKey = decodeURIComponent(key as string);
  const endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/registration/verify-email/";

  async function verifyEmail() {
    setIsLoading(true);
    setError(null);
    setResponseStatus(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ key: decodedKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError("Verification key is invalid or has already been used.");
        } else if (response.status === 500) {
          setError("An internal server error occurred. Please try again later.");
        } else {
          setError(data.detail || "An unknown error occurred. Please try again.");
        }
      } else {
        setIsSuccess(true);
        setResponseStatus("Email verified successfully! You can now log in.");
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/account/login");
        }, 3000);
      }
    } catch (err: any) {
      setError("Network error: Check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    verifyEmail();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verify your email</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isLoading ? "Verifying your email address..." : "Email verification"}
            </p>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Spinner aria-label="Verifying email" size="xl" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Please wait...</p>
            </div>
          )}

          {error && (
            <Alert color="failure" onDismiss={() => setError(null)}>
              <span className="font-medium">Error!</span> {error}
            </Alert>
          )}

          {isSuccess && responseStatus && (
            <Alert color="success" onDismiss={() => setResponseStatus(null)}>
              <span className="font-medium">Success!</span> {responseStatus}
            </Alert>
          )}

          {!isLoading && (
            <div className="space-y-4">
              {error && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    You can either try logging in or begin registration again.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => router.push("/account/login")}
                      className="w-full"
                      color="blue"
                    >
                      Go to login
                    </Button>
                    <Button
                      onClick={() => router.push("/account/register")}
                      className="w-full"
                      color="gray"
                    >
                      Register again
                    </Button>
                  </div>
                </div>
              )}

              {isSuccess && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Redirecting to login page in a few seconds...
                  </p>
                  <Button
                    onClick={() => router.push("/account/login")}
                    className="w-full"
                    color="blue"
                  >
                    Go to login now
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
