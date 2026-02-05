"use client";
import { Card } from "flowbite-react";
import { useState } from "react";
import JobSelector from "@/app/components/AddJob";
import AddResume from "@/app/components/AddResume";
import GenerateDocumentsNew from "@/app/components/GenerateDocumentsNew";

type Job = {
  id: number;
  job_position: string;
  company_name: string;
};

type Resume = {
  id: number;
  name: string;
  updated_at: string;
};

export default function Home() {
  const [selectedJobId, setSelectedJobId] = useState<number>(0);
  const [selectedResumeId, setSelectedResumeId] = useState<number>(0);

  const handleJobSelect = (job: Job | null) => {
    setSelectedJobId(job?.id || 0);
  };

  const handleResumeSelect = (resume: Resume | null) => {
    setSelectedResumeId(resume?.id || 0);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Let&apos;s land you the job
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">Add a job to get started building your resume</p>
        </div>

        {/* Step 1: Job Selection */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 1: Add job details</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new job or pick one you&apos;ve already added
              </p>
            </div>
            <JobSelector onJobSelect={handleJobSelect} />
          </div>
        </Card>

        {/* Step 2: Resume Upload */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 2: Add your background</h2>
            </div>
            <AddResume onResumeSelect={handleResumeSelect} />
          </div>
        </Card>

        {/* Step 3: Generate Documents */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 3: Generate documents</h2>
            </div>
            <GenerateDocumentsNew user_context_id={selectedResumeId} job_description_id={selectedJobId} />
          </div>
        </Card>
      </div>
    </div>
  );
}
