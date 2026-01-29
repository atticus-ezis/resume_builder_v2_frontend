"use client";

import { useState, useEffect, useCallback } from "react";
import { FileInput, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, TextInput } from "flowbite-react";
import { api } from "@/app/api";
import { formatDate } from "@/app/lib/formatDate";

type ExistingResume = {
  id: number;
  name: string;
  updated_at: string;
};

type PaginatedExistingResumes = {
  count: number;
  results: ExistingResume[];
  next: string;
  previous: string;
};

type AddResumeProps = {
  onResumeSelect?: (resume: ExistingResume) => void;
};

const PDF_ACCEPT = "application/pdf";

export default function AddResume({ onResumeSelect }: AddResumeProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ExistingResume | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingResumes, setHasExistingResumes] = useState(false);
  const [paginatedResumes, setPaginatedResumes] = useState<PaginatedExistingResumes>({
    count: 0,
    results: [],
    next: "",
    previous: "",
  });
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setFieldErrors((prev) => ({ ...prev, file: "" }));
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setFieldErrors((prev) => ({ ...prev, file: "Please select a PDF file" }));
        setFile(null);
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
  };

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newErrors: Record<string, string> = {};
    if (!file) newErrors.file = "Please select a PDF file";
    if (!name.trim()) newErrors.name = "Name is required";
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (!file) {
        setFieldErrors((prev) => ({ ...prev, file: "Please select a PDF file" }));
        setIsLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name.trim());

      const response = await api.post("/api/applicant/upload-pdf", formData);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data?.detail || "Failed to upload resume");
      }

      const resume: ExistingResume = {
        id: response.data.id,
        name: response.data.name ?? name.trim(),
        updated_at: response.data.updated_at ?? new Date().toISOString(),
      };
      setSelectedResume(resume);
      onResumeSelect?.(resume);
      setFile(null);
      setName("");
      if (e.target instanceof HTMLFormElement) e.target.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while uploading the resume";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getExistingResumes = useCallback(async (url?: string) => {
    try {
      setIsLoadingResumes(true);
      const requestUrl = url || "/api/applicant/";
      const response = await api.get(requestUrl);

      if (response.status !== 200) return;

      const data = response.data;
      if (data.count === 0) {
        setPaginatedResumes({ count: 0, results: [], next: "", previous: "" });
      } else {
        setPaginatedResumes(data);
        setHasExistingResumes(true);
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
    } finally {
      setIsLoadingResumes(false);
    }
  }, []);

  const handleSelectResume = (resume: ExistingResume) => {
    setSelectedResume(resume);
    onResumeSelect?.(resume);
    setShowModal(false);
  };

  const handlePrevious = () => {
    if (paginatedResumes.previous) getExistingResumes(paginatedResumes.previous);
  };

  const handleNext = () => {
    if (paginatedResumes.next) getExistingResumes(paginatedResumes.next);
  };

  useEffect(() => {
    if (showModal) getExistingResumes();
  }, [showModal, getExistingResumes]);

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <form onSubmit={handleUploadSubmit} className="space-y-4">
        <div>
          <Label htmlFor="resume-file">Upload resume (PDF)</Label>
          <FileInput id="resume-file" accept={PDF_ACCEPT} onChange={handleFileChange} className="mt-1" />
          {fieldErrors.file && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{fieldErrors.file}</p>}
        </div>
        <div>
          <Label htmlFor="resume-name">Name</Label>
          <TextInput
            id="resume-name"
            name="name"
            placeholder="e.g. My Resume 2024"
            value={name}
            onChange={handleNameChange}
            className="mt-1"
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{fieldErrors.name}</p>}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-fit" disabled={isLoading}>
          {isLoading ? "Uploading..." : "Upload"}
        </Button>
      </form>

      {/* Choose existing */}
      {hasExistingResumes && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400">or</span>
          <Button onClick={() => setShowModal(true)} color="gray" outline className="w-fit">
            Choose from existing resumes
          </Button>
        </div>
      )}

      {/* Selected resume badge */}
      {selectedResume && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Selected: <span className="font-semibold">{selectedResume.name}</span>
            <span className="ml-1 text-gray-600 dark:text-gray-400">
              (Updated {formatDate(selectedResume.updated_at)})
            </span>
          </span>
          <Button size="xs" color="gray" onClick={() => setSelectedResume(null)}>
            Clear
          </Button>
        </div>
      )}

      {/* Existing resumes modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="2xl">
        <ModalHeader>Choose from existing resumes</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {paginatedResumes.count} resume{paginatedResumes.count !== 1 ? "s" : ""} found
            </p>

            {isLoadingResumes ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading resumes...</div>
            ) : paginatedResumes.results.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">No resumes found</div>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {paginatedResumes.results.map((resume) => (
                  <div
                    key={resume.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectResume(resume)}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectResume(resume)}
                    className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{resume.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated: {formatDate(resume.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={handlePrevious}
                disabled={!paginatedResumes.previous || isLoadingResumes}
                color="gray"
                outline
              >
                Previous
              </Button>
              <Button onClick={handleNext} disabled={!paginatedResumes.next || isLoadingResumes} color="gray" outline>
                Next
              </Button>
            </div>
            <Button onClick={() => setShowModal(false)} color="gray">
              Close
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
}
