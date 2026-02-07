import { api } from "@/app/api";
import { Select, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { AxiosResponse } from "axios";
import DraftDisplay, { type DocumentDraftResponse, type DocumentDraftHistory } from "@/app/components/DraftDisplay";

const blankDocumentDraftResponse: DocumentDraftResponse = {
  id: 0,
  markdown: "",
  version_name: "",
  document: {
    id: 0,
    type: "",
  },
  created_at: "",
};

export default function GenerateDocuments({
  user_context_id,
  job_description_id,
  onMissingSelection,
}: {
  user_context_id: number;
  job_description_id: number;
  onMissingSelection?: (missing: "job" | "resume") => void;
}) {
  const [resumeDraftResponse, setResumeDraftResponse] = useState<DocumentDraftResponse>(blankDocumentDraftResponse);
  const [coverLetterDraftResponse, setCoverLetterDraftResponse] =
    useState<DocumentDraftResponse>(blankDocumentDraftResponse);

  const [resumeDraftHistory, setResumeDraftHistory] = useState<DocumentDraftHistory[]>([]);
  const [coverLetterDraftHistory, setCoverLetterDraftHistory] = useState<DocumentDraftHistory[]>([]);
  const [showCustomPrompt, setShowCustomPrompt] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getTestDrafts() {
    try {
      const response = await api.get(`api/document-version/1/`);
      responseErrorHandler(response);
      const doc_draft = response.data;
    console.log("!!!!!! doc_draft", doc_draft);
    type DocumentDraftResponse = {
      id: number;
      markdown: string;
      version_name: string;
      document: {
        id: number;
        type: string;
      };
      created_at: string;
    };
    setResumeDraftResponse({
      id: doc_draft.id,
      markdown: doc_draft.markdown,
      version_name: doc_draft.version_name,
      document: {
        id: doc_draft.document.id,
        type: "resume",
      },
      created_at: doc_draft.created_at,
    } as DocumentDraftResponse);
    } catch {
      // Toast shown by api interceptor
    }
  }
  useEffect(() => {
    getTestDrafts();
  }, []);

  async function handleGenerateCommand(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!job_description_id) {
      setLoading(false);
      onMissingSelection?.("job");
      return;
    }
    if (!user_context_id) {
      setLoading(false);
      onMissingSelection?.("resume");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const command = formData.get("command") as string;
    const payload = { user_context_id, job_description_id, command };

    try {
      const response = await api.post(`api/generate-resume-and-cover-letter/`, payload);
      responseErrorHandler(response);
      const doc_drafts = response.data as DocumentDraftResponse[];
      const expected_length = command === "generate_both" ? 2 : 1;
      if (doc_drafts.length !== expected_length) {
        throw new Error("Expected " + expected_length + " documents, got " + doc_drafts.length);
      }
      handleNewDraft(doc_drafts);
    } catch {
      // Toast shown by api interceptor
    } finally {
      setLoading(false);
    }
  }

  function handleNewDraft(drafts: DocumentDraftResponse[]) {
    for (const draft of drafts) {
      if (draft.document.type === "resume") {
        setResumeDraftResponse(draft);
        setResumeDraftHistory((prev) => [
          ...prev,
          { id: draft.id, version_name: draft.version_name, created_at: draft.created_at },
        ]);
      } else if (draft.document.type === "cover_letter") {
        setCoverLetterDraftResponse(draft);
        setCoverLetterDraftHistory((prev) => [
          ...prev,
          { id: draft.id, version_name: draft.version_name, created_at: draft.created_at },
        ]);
      }
    }
  }

  function handleUpdateDraft(draft: DocumentDraftResponse) {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const version_name =
        draft.version_name !== formData.get("draftName") ? (formData.get("draftName") as string) : null;
      const markdown = draft.markdown !== formData.get("markdown") ? (formData.get("markdown") as string) : null;
      const instructions = (formData.get("instructions") as string) || null;

      if (!version_name && !markdown && !instructions) {
        setError("No changes made");
        return;
      }

      // Build payload, excluding empty/null optional fields
      const payload: any = {
        document_version_id: draft.id,
      };
      if (version_name) payload.version_name = version_name;
      if (markdown) payload.markdown = markdown;
      if (instructions) payload.instructions = instructions;

      try {
        setError(null);
        const response = await api.post("api/update-content/", payload);
        responseErrorHandler(response);
        const newDraft = arrayProof(response.data) as DocumentDraftResponse[];
        handleNewDraft(newDraft);
      } catch {
        // Toast shown by api interceptor
      }
    };
  }

  const handleToggleCustomPrompt = (draftId: number, show: boolean) => {
    setShowCustomPrompt({ ...showCustomPrompt, [draftId]: show });
  };

  const handleDownload = async (draft: DocumentDraftResponse, e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Get form data to check if anything changed
      const form = e.currentTarget.closest("form");
      let finalDraftId = draft.id;

      if (form) {
        const formData = new FormData(form);
        const currentName = formData.get("draftName") as string;
        const currentMarkdown = formData.get("markdown") as string;

        // Check if anything changed
        const markdownChanged = draft.markdown !== currentMarkdown;
        const versionNameChanged = draft.version_name !== currentName;

        // If anything changed, update first
        if (markdownChanged || versionNameChanged) {
          const patchPayload: any = {};
          if (currentName) patchPayload.version_name = currentName;
          if (markdownChanged) patchPayload.markdown = currentMarkdown;

          const updateResponse = await api.patch(`api/document-version/${draft.id}/`, patchPayload);
          responseErrorHandler(updateResponse);
          const updateData = updateResponse.data;
          const newDraft = {
            id: updateData.id,
            markdown: updateData.markdown,
            version_name: updateData.version_name,
            document: {
              id: draft.document.id,
              type: draft.document.type,
            },
            created_at: updateData.created_at,
          } as DocumentDraftResponse;
          const proofedDraft = arrayProof(newDraft);
          handleNewDraft(proofedDraft);
          finalDraftId = updateData.id;
        }
      }

      // Download the PDF with proper blob response handling
      const downloadResponse = await api.get(`/api/document-version/${finalDraftId}/pdf/`, {
        responseType: "blob",
      });

      const contentDisposition = downloadResponse.headers["content-disposition"];
      const filenameMatch =
        typeof contentDisposition === "string" && contentDisposition.match(/filename="?([^";\n]+)"?/i);
      const downloadFilename = filenameMatch
        ? filenameMatch[1].trim().replace(/^"(.*)"$/, "$1")
        : `${draft.version_name || docTypeToText(draft.document.type)}.pdf`;

      const blob = new Blob([downloadResponse.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Toast shown by api interceptor
    }
  };


  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      <div>
        <form onSubmit={handleGenerateCommand} className="flex flex-col gap-3">
          <label htmlFor="command-select" className="text-adaptive-label">
            Select Document Type:
          </label>
          <Select id="command-select" name="command" defaultValue="generate_resume" disabled={loading}>
            <option value="generate_resume">Resume</option>
            <option value="generate_cover_letter">Cover Letter</option>
            <option value="generate_both">Both</option>
          </Select>
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? "Generating..." : "Generate"}
          </Button>
        </form>
      </div>
      <div>
        <DraftDisplay
          drafts={[
            [resumeDraftResponse, resumeDraftHistory],
            [coverLetterDraftResponse, coverLetterDraftHistory],
          ]}
          showCustomPrompt={showCustomPrompt}
          onToggleCustomPrompt={handleToggleCustomPrompt}
          onUpdateDraft={handleUpdateDraft}
          onDraftChange={handleNewDraft}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}

/// helper functions
function docTypeToText(doc_type: string): string {
  switch (doc_type) {
    case "resume":
      return "Resume";
    case "cover_letter":
      return "Cover Letter";
    default:
      return doc_type;
  }
}

function arrayProof(data: DocumentDraftResponse | DocumentDraftResponse[]): DocumentDraftResponse[] {
  if (!Array.isArray(data)) {
    return [data];
  }
  return data;
}

function responseErrorHandler(response: AxiosResponse) {
  if (response.status !== 200) {
    throw new Error("Error updating draft: " + response.statusText);
  }
  return response;
}
