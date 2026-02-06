"use client";

import { Card } from "flowbite-react";
import { useState, useRef, useCallback } from "react";
import AddJob from "@/app/components/AddJob";
import AddResume from "@/app/components/AddResume";
import GenerateDocuments from "@/app/components/GenerateDocuments";

type Job = {
  id: number;
  job_position: string;
  company_name: string;
};

export type Resume = {
  id: number;
  name: string;
  updated_at: string;
};

export default function Home() {
  const [selectedJobId, setSelectedJobId] = useState<number>(0);
  const [selectedResumeId, setSelectedResumeId] = useState<number>(0);
  const [missingStep, setMissingStep] = useState<"job" | "resume" | null>(null);
  const jobSectionRef = useRef<HTMLDivElement>(null);
  const resumeSectionRef = useRef<HTMLDivElement>(null);

  const handleJobSelect = useCallback((job: Job | null) => {
    setSelectedJobId(job?.id || 0);
    setMissingStep(null);
  }, []);

  const handleResumeSelect = useCallback((resume: Resume | null) => {
    setSelectedResumeId(resume?.id || 0);
    setMissingStep(null);
  }, []);

  const handleMissingSelection = useCallback((missing: "job" | "resume") => {
    setMissingStep(missing);
    if (missing === "job") {
      jobSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      resumeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

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
        <Card ref={jobSectionRef}>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 1: Add job details</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new job or pick one you&apos;ve already added
              </p>
            </div>
            {missingStep === "job" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Please select a job before generating documents.
                </p>
              </div>
            )}
            <AddJob onJobSelect={handleJobSelect} />
          </div>
        </Card>

        {/* Step 2: Resume Upload */}
        <Card ref={resumeSectionRef}>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 2: Add your background</h2>
            </div>
            {missingStep === "resume" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Please select a resume before generating documents.
                </p>
              </div>
            )}
            <AddResume onResumeSelect={handleResumeSelect} />
          </div>
        </Card>

        {/* Step 3: Generate Documents */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 3: Generate documents</h2>
            </div>
            <GenerateDocuments
              user_context_id={selectedResumeId}
              job_description_id={selectedJobId}
              onMissingSelection={handleMissingSelection}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
