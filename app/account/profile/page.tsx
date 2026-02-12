"use client";
import { api } from "@/app/api";
import { useEffect, useState } from "react";
import Link from "next/link";

type ProfileData = {
  id: number;
  email: string;
  email_verified: boolean;
  application_count: number;
  date_joined: string;
  last_login: string | null;
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function getProfile() {
    try {
      const response = await api.get("/api/accounts/profile/");
      setProfile(response.data);
    } catch {
      // Toast shown by api interceptor; user can login/signup from there
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getProfile();
  }, []);

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 h-8 w-48 mb-4" />
        <div className="animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 h-4 w-full max-w-md" />
      </div>
    );
  }

  if (!profile) {
    return null; // Error already handled by api interceptor toast
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile</h1>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</span>
          <p className="text-gray-900 dark:text-white">{profile.email}</p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email verified</span>
          <p className="text-gray-900 dark:text-white">
            {profile.email_verified ? "Yes" : "No"}
            {!profile.email_verified && (
              <>
                {" "}
                <Link
                  href={`/account/login/resend-email?email=${encodeURIComponent(profile.email)}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Resend verification email
                </Link>
              </>
            )}
          </p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Applications</span>
          <p className="text-gray-900 dark:text-white">
            <Link href="/account/applications" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              {profile.application_count}
            </Link>
          </p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date joined</span>
          <p className="text-gray-900 dark:text-white">{formatDate(profile.date_joined)}</p>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/account/change-password"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Change password
          </Link>
        </div>
      </div>
    </div>
  );
}
