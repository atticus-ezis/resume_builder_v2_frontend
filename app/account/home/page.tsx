"use client";
import { Card, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { api } from "@/app/api";
import JobSelectionModal from "@/app/components/JobSelectionModal";
import CreateJobFormModal from "@/app/components/CreateJobFormModal";
import AddResume from "@/app/components/AddResume";
import GenerateDocumentsNew from "@/app/components/GenerateDocumentsNew";

// The backend returns a paginated list of existing jobs like ...
// {
//     "count": 123,
//     "next": "http://api.example.org/accounts/?page=4",
//     "previous": "http://api.example.org/accounts/?page=2",
//     "results": [
//       {
//         "id": 0,
//         "company_name": "string",
//         "job_position": "string",
//         "updated_at": "2026-01-28T05:59:52.977Z"
//       }
//     ]
//   }
//
//  if any jobs exist a button should appear which displays a modal with the paginated results when clicked
//  when a job is clicked it's id should be stored in jobContextId and it should close the modal

// If the user selects add new job post a form to this endpoint: api/job/
// {
//   "job_context": jobContext
// }

type NewJob = {
  job_position: string;
  company_name: string;
  company_overview: string;
  job_description: string;
  job_requirements: string;
};

const EMPTY_RESUME: { id: number; name: string; updated_at: string } = { id: 0, name: "", updated_at: "" };
const EMPTY_JOB: { id: number; job_position: string; company_name: string } = {
  id: 0,
  job_position: "",
  company_name: "",
};

export default function Home() {
  const [newJob, setNewJob] = useState<NewJob>({
    job_position: "",
    company_name: "",
    company_overview: "",
    job_description: "",
    job_requirements: "",
  });
  const [showExistingJobsModal, setShowExistingJobsModal] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{ id: number; job_position: string; company_name: string } | null>(
    null
  );
  const [hasExistingJobs, setHasExistingJobs] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{ id: number; name: string; updated_at: string } | null>(null);

  const handleJobSelect = (job: { id: number; job_position: string; company_name: string }) => {
    setSelectedJob(job);
  };

  const handleResumeSelect = (resume: { id: number; name: string; updated_at: string }) => {
    setSelectedResume(resume);
  };

  // Check if there are existing jobs on mount
  useEffect(() => {
    const checkExistingJobs = async () => {
      try {
        const response = await api.get("/api/job/");
        if (response.status === 200 && response.data.count > 0) {
          setHasExistingJobs(true);
        }
      } catch (error) {
        console.error("Error checking existing jobs:", error);
      }
    };
    checkExistingJobs();
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

        {/* Add Job Card */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 1: Add job details</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new job or pick one you&apos;ve already added
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setShowNewJobModal(true)} className="w-fit">
                Add New Job
              </Button>
              {hasExistingJobs && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">or</span>
                  <Button onClick={() => setShowExistingJobsModal(true)} color="gray" outline className="w-fit">
                    Choose from an existing job
                  </Button>
                </>
              )}
            </div>

            {selectedJob && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Selected: <span className="font-semibold">{selectedJob.job_position}</span> at{" "}
                  <span className="font-semibold">{selectedJob.company_name}</span>
                </span>
                <Button size="xs" color="gray" onClick={() => setSelectedJob(null)}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </Card>
        {/* User Background Card */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 2: Add your background</h2>
            </div>
            <div>
              <AddResume onResumeSelect={handleResumeSelect} />
            </div>

            <div />
          </div>
        </Card>
        {/* Generate Documents */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Step 3: Generate documents</h2>
            </div>
            {/* if both are present, call and display the api response*/}
            <GenerateDocumentsNew user_context_id={selectedResume?.id || 0} job_description_id={selectedJob?.id || 0} />
          </div>
        </Card>
      </div>

      <CreateJobFormModal
        show={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        onJobSelect={handleJobSelect}
      />
      <JobSelectionModal
        show={showExistingJobsModal}
        onClose={() => setShowExistingJobsModal(false)}
        onJobSelect={handleJobSelect}
      />
    </div>
  );
}
