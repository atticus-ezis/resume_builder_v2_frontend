"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { api } from "@/app/api";

type Job = {
  id: number;
  company_name: string;
  job_position: string;
  updated_at: string;
};

type PaginatedExistingJobs = {
  count: number;
  results: Job[];
  next: string;
  previous: string;
};

type SelectedJob = {
  id: number;
  job_position: string;
  company_name: string;
};

type JobSelectionModalProps = {
  show: boolean;
  onClose: () => void;
  onJobSelect: (job: SelectedJob) => void;
};

export default function JobSelectionModal({ show, onClose, onJobSelect }: JobSelectionModalProps) {
  const [paginatedExistingJobs, setPaginatedExistingJobs] = useState<PaginatedExistingJobs>({
    count: 0,
    results: [],
    next: "",
    previous: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const getExistingJobs = useCallback(async (url?: string) => {
    try {
      setIsLoading(true);
      if (!url) {
        url = "/api/job/";
      }
      const response = await api.get(url);

      if (response.status !== 200) {
        console.error("Failed to get existing jobs", response.data);
        return;
      }

      const responseData = response.data;
      if (responseData.count === 0) {
        setPaginatedExistingJobs({
          count: 0,
          results: [],
          next: "",
          previous: "",
        });
      } else {
        setPaginatedExistingJobs(responseData);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleJobSelect = (job: Job) => {
    onJobSelect({
      id: job.id,
      job_position: job.job_position,
      company_name: job.company_name,
    });
    onClose();
  };

  const handlePrevious = () => {
    if (paginatedExistingJobs.previous) {
      getExistingJobs(paginatedExistingJobs.previous);
    }
  };

  const handleNext = () => {
    if (paginatedExistingJobs.next) {
      getExistingJobs(paginatedExistingJobs.next);
    }
  };

  // Fetch jobs when modal opens
  useEffect(() => {
    if (show) {
      getExistingJobs();
    }
  }, [show, getExistingJobs]);

  return (
    <Modal show={show} onClose={onClose} size="2xl">
      <ModalHeader>Select an Existing Job</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {paginatedExistingJobs.count} job{paginatedExistingJobs.count !== 1 ? "s" : ""} found
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading jobs...</div>
          ) : paginatedExistingJobs.results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No jobs found</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {paginatedExistingJobs.results.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobSelect(job)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.job_position}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{job.company_name}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                      Updated: {formatDate(job.updated_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2">
            <Button
              onClick={handlePrevious}
              disabled={!paginatedExistingJobs.previous || isLoading}
              color="gray"
              outline
            >
              Previous
            </Button>
            <Button onClick={handleNext} disabled={!paginatedExistingJobs.next || isLoading} color="gray" outline>
              Next
            </Button>
          </div>
          <Button onClick={onClose} color="gray">
            Close
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
