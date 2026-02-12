"use client";
import Link from "next/link";
import { Button } from "flowbite-react";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const { isVerified } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Create Tailored Resumes</span>
            <span className="block text-blue-600 dark:text-blue-400">In Minutes, Not Hours</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Land your dream job with AI-powered, role-specific resumes and cover letters that stand out from the
            competition.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            {isVerified ? (
              <Button as={Link} href="/account/generate" size="xl" className="px-8 py-3">
                Create Resume
              </Button>
            ) : (
              <>
                <Button as={Link} href="/account/register" size="xl" className="px-8 py-3">
                  Sign Up
                </Button>
                <Button as={Link} href="/account/login" size="xl" color="gray" outline className="px-8 py-3">
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Save Time</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Stop spending hours crafting custom resumes and cover letters for each job application. Generate them in
              minutes.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Simple Process</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Just copy and paste the job description. Our AI analyzes it and generates a perfectly tailored PDF resume
              and cover letter.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">ATS-Optimized</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Role-specific, ATS-friendly formatting ensures your resume passes automated screening and reaches human
              recruiters.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-blue-600 px-6 py-16 text-center shadow-xl dark:bg-blue-700 sm:px-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to land your dream job?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">Beat the AI screening, save time, work smarter.</p>
          <div className="mt-8">
            <Button
              as={Link}
              href={isVerified ? "/account/generate" : "/account/register"}
              size="xl"
              color="light"
              className="px-8 py-3"
            >
              {isVerified ? "Try It Now" : "Get Started"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
