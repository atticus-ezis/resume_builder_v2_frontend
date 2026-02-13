"use client";

import { useState, useEffect } from "react";
import { Button } from "flowbite-react";
import { api } from "@/app/api";
import { formatDate } from "@/app/lib/formatDate";
import PaginationModal from "@/app/components/PaginationModal";
import ResumeUploadForm from "@/app/components/ResumeUploadForm";
import type { Resume } from "@/app/account/generate/page";
import { toast } from "react-hot-toast";

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
  const [hasExistingResumes, setHasExistingResumes] = useState(false);
  const [paginatedExistingResumes, setPaginatedExistingResumes] = useState<PaginatedExistingResumes>({
    count: 0,
    results: [],
    next: "",
    previous: "",
  });

  async function checkExistingResumes() {
    try {
      const response = await api.get("/api/applicant/", { skipErrorToast: true } as any);
      if (response.status === 200 && response.data.count > 0) {
        setHasExistingResumes(true);
        setPaginatedExistingResumes(response.data);
      }
    } catch {
      toast.dismiss();
      // Toast shown by api interceptor
    }
  }

  useEffect(() => {
    checkExistingResumes();
  }, []);

  async function paginationCall(url: string | null) {
    if (!url) {
      url = "/api/applicant/";
    }
    try {
      const response = await api.get(url);
      if (response.status === 200 && response.data.count > 0) {
        setPaginatedExistingResumes(response.data);
      }
    } catch {
      // Toast shown by api interceptor
    }
  }

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

      <PaginationModal<Resume>
        title="Existing Resumes"
        paginationData={paginatedExistingResumes}
        renderItem={(resume) => (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900 dark:text-white">{resume.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 justify-end">
              {formatDate(resume.updated_at)}
            </span>
          </div>
        )}
        onSelect={setResume}
        show={showExistingResumesModal}
        onClose={handleOnClose}
        onPageChange={paginationCall}
      />
    </>
  );
}
