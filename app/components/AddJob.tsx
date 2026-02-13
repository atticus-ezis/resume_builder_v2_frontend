"use client";

import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { api } from "@/app/api";
import CreateJobFormModal from "@/app/components/CreateJobFormModal";
import PaginationModal from "@/app/components/PaginationModal";
import { toast } from "react-hot-toast";

// sets JobID useState for homepage with onJobSelect

// check for existing jobs and store + display results
// the modal that displays these results will be re-usable, start with Flow-bites

export type Job = {
  id: number;
  job_position: string;
  company_name: string;
};

type PaginatedExistingJobs = {
  count: number;
  results: Job[];
  next: string;
  previous: string;
};

type JobSelectorProps = {
  onJobSelect?: (job: Job | null) => void;
  value?: Job | null;
};

export default function JobSelector({ onJobSelect, value }: JobSelectorProps) {
  const [showExistingJobsModal, setShowExistingJobsModal] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [internalSelectedJob, setInternalSelectedJob] = useState<Job | null>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const selectedJob = value !== undefined ? value : internalSelectedJob;
  const [hasExistingJobs, setHasExistingJobs] = useState(false);
  const [paginatedExistingJobs, setPaginatedExistingJobs] = useState<PaginatedExistingJobs>({
    count: 0,
    results: [],
    next: "",
    previous: "",
  });

  async function checkExistingJobs() {
    try {
      const response = await api.get("/api/job/", { skipErrorToast: true } as any);
      if (response.status === 200 && response.data.count > 0) {
        setHasExistingJobs(true);
      }
    } catch {
      // Silently fail - checking for existing jobs, no need to show error
    }
  }

  async function paginationCall(url: string | null) {
    if (!url) {
      url = "/api/job/";
    }
    try {
      const response = await api.get(url);
      if (response.status === 200 && response.data.count > 0) {
        setPaginatedExistingJobs(response.data);
      }
    } catch {
      // Toast shown by api interceptor
    }
  }

  // Check if there are existing jobs on mount
  useEffect(() => {
    checkExistingJobs();
  }, []);

  // Load first page when existing-jobs modal opens
  useEffect(() => {
    if (showExistingJobsModal) {
      paginationCall(null);
    }
  }, [showExistingJobsModal]);

  const setJob = (job: Job | null) => {
    // Update internal state only if not controlled
    if (value === undefined) {
      setInternalSelectedJob(job);
    }
    // Always notify parent
    onJobSelect?.(job);
  };

  const handleOnClose = () => setShowExistingJobsModal(false);
  return (
    <>
      <div className="space-y-4">
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
            <Button size="xs" color="gray" onClick={() => setJob(null)}>
              Clear
            </Button>
          </div>
        )}
      </div>
      <PaginationModal<Job>
        title="Existing Jobs"
        paginationData={paginatedExistingJobs}
        renderItem={(job) => (
          <>
            <h3 className="font-semibold text-gray-900 dark:text-white">{job.job_position}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{job.company_name}</p>
          </>
        )}
        onSelect={setJob}
        show={showExistingJobsModal}
        onClose={handleOnClose}
        onPageChange={paginationCall}
      />
      <CreateJobFormModal show={showNewJobModal} onClose={() => setShowNewJobModal(false)} onJobSelect={setJob} />
    </>
  );
}
