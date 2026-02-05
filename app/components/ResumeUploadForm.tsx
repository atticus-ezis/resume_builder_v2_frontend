"use client";

import { useState } from "react";
import { FileInput, Label, Button, TextInput } from "flowbite-react";
import { api } from "@/app/api";
import type { Resume } from "@/app/account/home/page";

type ResumeUploadFormProps = {
  setResume: (resume: Resume) => void;
  onUploadSuccess?: () => void;
};

const PDF_ACCEPT = "application/pdf";

export default function ResumeUploadForm({ setResume, onUploadSuccess }: ResumeUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setFieldErrors((prev) => ({ ...prev, file: "" }));
    if (selectedFile) {
      if (selectedFile.type !== PDF_ACCEPT) {
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
      const formData = new FormData();
      formData.append("file", file as File);
      formData.append("name", name.trim());

      const response = await api.post("/api/applicant/upload-pdf/", formData);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data?.detail || "Failed to upload resume");
      }

      const resume: Resume = {
        id: response.data.id,
        name: response.data.name ?? name.trim(),
        updated_at: response.data.updated_at ?? new Date().toISOString(),
      };
      setResume(resume);
      setFile(null);
      setName("");
      if (e.target instanceof HTMLFormElement) e.target.reset();

      onUploadSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while uploading the resume";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}
