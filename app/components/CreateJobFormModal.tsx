import { Modal, ModalHeader, ModalBody, ModalFooter, Textarea, TextInput, Button, Label } from "flowbite-react";
import { useState } from "react";
import { api } from "@/app/api";

type CreateJobFormModalProps = {
  show: boolean;
  onClose: () => void;
  onJobSelect: (job: { id: number; job_position: string; company_name: string }) => void;
};

type JobContext = {
  job_position: string;
  company_name: string;
  company_overview: string;
  job_description: string;
  job_requirements: string;
};

export default function CreateJobFormModal({ show, onClose, onJobSelect }: CreateJobFormModalProps) {
  const [jobContext, setJobContext] = useState<JobContext>({
    job_position: "",
    company_name: "",
    company_overview: "",
    job_description: "",
    job_requirements: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setJobContext({ ...jobContext, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    for (const [key, value] of Object.entries(jobContext)) {
      if (!value) {
        setFieldErrors({ ...fieldErrors, [key]: "This field is required" });
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/job/", {
        job_context: jobContext,
      });
      if (response.status !== 201) {
        throw new Error("Failed to create job");
      } else {
        onJobSelect({
          id: response.data.id || response.data.pk,
          job_position: response.data.job_position,
          company_name: response.data.company_name,
        });
        onClose();
      }
    } catch (error) {
      setError("An error occurred while creating the job");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Enter Job Details</ModalHeader>
      <ModalBody>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        <form id="create-job-form" onSubmit={handleSubmit}>
          <Label htmlFor="job_position">Job Position</Label>
          <TextInput
            name="job_position"
            placeholder="Job Position"
            value={jobContext.job_position}
            onChange={handleChange}
          />
          {fieldErrors.job_position && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{fieldErrors.job_position}</p>
            </div>
          )}
          <Label htmlFor="company_name">Company Name</Label>
          <TextInput
            name="company_name"
            placeholder="Company Name"
            value={jobContext.company_name}
            onChange={handleChange}
          />
          {fieldErrors.company_name && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{fieldErrors.company_name}</p>
            </div>
          )}
          <Label htmlFor="company_overview">Company Overview</Label>
          <Textarea
            name="company_overview"
            placeholder="Company Overview"
            value={jobContext.company_overview}
            onChange={handleChange}
          />
          {fieldErrors.company_overview && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{fieldErrors.company_overview}</p>
            </div>
          )}
          <Label htmlFor="job_description">Job Description</Label>
          <Textarea
            name="job_description"
            placeholder="Job Description"
            value={jobContext.job_description}
            onChange={handleChange}
          />
          {fieldErrors.job_description && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{fieldErrors.job_description}</p>
            </div>
          )}
          <Label htmlFor="job_requirements">Job Requirements</Label>
          <Textarea
            name="job_requirements"
            placeholder="Job Requirements"
            value={jobContext.job_requirements}
            onChange={handleChange}
          />
          {fieldErrors.job_requirements && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{fieldErrors.job_requirements}</p>
            </div>
          )}
        </form>
      </ModalBody>
      <ModalFooter>
        <Button type="button" onClick={onClose} color="gray">
          Close
        </Button>
        <Button type="submit" form="create-job-form" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
