"use client";
import { Card, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { api } from "@/app/api";
import JobSelectionModal from "@/app/components/JobSelectionModal";
import CreateJobFormModal from "@/app/components/CreateJobFormModal";

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
    null,
  );
  const [hasExistingJobs, setHasExistingJobs] = useState(false);

  const handleJobSelect = (job: { id: number; job_position: string; company_name: string }) => {
    setSelectedJob(job);
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
    <>
      <h1>Lets land you the job!</h1>
      <Card>
        <div></div>
        <span>Step 1: Add job details</span>
        <Button onClick={() => setShowNewJobModal(true)}>Add New Job</Button>
        <CreateJobFormModal
          show={showNewJobModal}
          onClose={() => setShowNewJobModal(false)}
          onJobSelect={handleJobSelect}
        />
        {hasExistingJobs && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 dark:text-gray-400">or</span>
            <Button onClick={() => setShowExistingJobsModal(true)}>Choose from an existing job</Button>
          </div>
        )}
        ;
        <JobSelectionModal
          show={showExistingJobsModal}
          onClose={() => setShowExistingJobsModal(false)}
          onJobSelect={handleJobSelect}
        />
        {selectedJob && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Selected: <span className="font-semibold">{selectedJob.job_position}</span> at{" "}
              <span className="font-semibold">{selectedJob.company_name}</span>
            </span>
            <Button size="xs" color="gray" onClick={() => setSelectedJob(null)} className="ml-2">
              Clear
            </Button>
          </div>
        )}
        ;
      </Card>
    </>
  );
}
