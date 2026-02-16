import { Suspense } from "react";
import ResendEmailForm from "./ResendEmailForm";

export default function ResendEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      }
    >
      <ResendEmailForm />
    </Suspense>
  );
}
