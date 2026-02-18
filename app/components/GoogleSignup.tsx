// this is the uri frontend sends
// http://localhost:3000/account/login/google-callback
//

"use client";
function GoogleLoginButton() {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}/account/login/google-callback` : "";

  const handleLogin = () => {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    window.location.href = authUrl.toString();
  };

  return (
    <button
      onClick={handleLogin}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Spinner, Alert } from "flowbite-react";

// Callback page component
function GoogleCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("No authorization code received from Google.");
      return;
    }

    async function handleCallback() {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/auth/google/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.non_field_errors) {
            const nonFieldErrors = data.non_field_errors[0];
            setError(nonFieldErrors);
          }
          setError(data[0][0] || "Failed to authenticate with Google.");
          return;
        }

        // Handle successful login
        router.push("/account/generate");
      } catch {
        setError("Network error: Check your connection and try again.");
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <Alert color="failure">
            <span className="font-medium">Authentication Failed</span>
            <p className="mt-2">{error}</p>
          </Alert>
          <div className="mt-4 text-center">
            <a href="/account/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Back to Login
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <div className="space-y-6 text-center">
          <Spinner size="xl" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Signing you in with Google</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait...</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { GoogleLoginButton, GoogleCallbackHandler };
