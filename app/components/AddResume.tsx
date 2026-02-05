"use client";

import { useState, useEffect } from "react";
import { Button } from "flowbite-react";
import { api } from "@/app/api";
import { formatDate } from "@/app/lib/formatDate";
import PaginationReader from "@/app/components/PaginationReader";
import ResumeUploadForm, { type Resume } from "@/app/components/ResumeUploadForm";

type PaginatedExistingResumes = {
  count: number;
  results: Resume[];
  next: string;
  previous: string;
};

type AddResumeProps = {
  onResumeSelect?: (resume: Resume | null) => void;
};

export default function AddResume({ onResumeSelect }: AddResumeProps) {
  const [showExistingResumesModal, setShowExistingResumesModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [hasExistingResumes, setHasExistingResumes] = useState(true);
  const [paginatedExistingResumes, setPaginatedExistingResumes] = useState<PaginatedExistingResumes>({
    count: 0,
    results: [],
    next: "",
    previous: "",
  });

  async function checkExistingResumes() {
    console.log("Checking existing resumes");
    const response = await api.get("/api/applicant/");
    if (response.status === 200 && response.data.count > 0) {
      setHasExistingResumes(true);
    }
  }

  console.log("Has existing resumes:", hasExistingResumes);

  async function paginationCall(url: string | null) {
    if (!url) {
      url = "/api/applicant/";
    }
    try {
      const response = await api.get(url);
      if (response.status === 200 && response.data.count > 0) {
        setPaginatedExistingResumes(response.data);
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
    }
  }

  useEffect(() => {
    checkExistingResumes();
  }, []);

  useEffect(() => {
    if (showExistingResumesModal) {
      paginationCall(null);
    }
  }, [showExistingResumesModal]);

  const setResume = (resume: Resume | null) => {
    setSelectedResume(resume);
    onResumeSelect?.(resume);
  };

  const handleOnClose = () => setShowExistingResumesModal(false);

  return (
    <>
      <div className="space-y-4">
        <ResumeUploadForm setResume={setResume} onUploadSuccess={() => paginationCall(null)} />
        <div className="flex flex-wrap items-center gap-3">
          {hasExistingResumes && (
            <>
              <span className="text-gray-500 dark:text-gray-400">or</span>
              <Button onClick={() => setShowExistingResumesModal(true)} color="gray" outline className="w-fit">
                Choose from an existing resume
              </Button>
            </>
          )}
        </div>

        {selectedResume && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Selected: <span className="font-semibold">{selectedResume.name}</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">
                (Updated {formatDate(selectedResume.updated_at)})
              </span>
            </span>
            <Button size="xs" color="gray" onClick={() => setResume(null)}>
              Clear
            </Button>
          </div>
        )}
      </div>

      <PaginationReader<Resume>
        title="Existing Resumes"
        paginationData={paginatedExistingResumes}
        renderItem={(resume) => (
          <>
            <span className="font-semibold text-gray-900 dark:text-white">{resume.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Updated: {formatDate(resume.updated_at)}</span>
          </>
        )}
        onSelect={setResume}
        show={showExistingResumesModal}
        onClose={handleOnClose}
        onPageChange={paginationCall}
      />
    </>
  );
}
