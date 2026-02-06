import { api } from "@/app/api";
import { Select, Button, TextInput, Textarea } from "flowbite-react";
import { useState, useEffect } from "react";
import { AxiosResponse } from "axios";

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

type DocumentDraftHistory = {
  id: number;
  version_name: string;
  created_at: string;
};

// Extracted Components
type HistoryDropdownProps = {
  history: DocumentDraftHistory[];
  currentDraftId: number;
  onSelectVersion: (versionId: number) => void;
};

function HistoryDropdown({ history, currentDraftId, onSelectVersion }: HistoryDropdownProps) {
  if (history.length <= 1) {
    return null;
  }

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    onSelectVersion(Number(e.target.value));
  }

  return (
    <>
      <label htmlFor="version-select" className="text-adaptive-label">
        Drafts:
      </label>
      <Select id="version-select" value={currentDraftId} onChange={handleSelect}>
        {history.map((item) => (
          <option key={item.id} value={item.id}>
            {item.version_name || `Draft ${item.id}`}
          </option>
        ))}
      </Select>
    </>
  );
}

async function onDownload(draft: DocumentDraftResponse) {
  console.log("Downloading draft:");
  const requestBody: {
    document_version_id: number;
    file_name: string;
    markdown: string;
  } = {
    document_version_id: draft.id,
    file_name: draft.version_name,
    markdown: draft.markdown,
  };
  try {
    const response = await api.post(`api/download-content/`, requestBody);
    responseErrorHandler(response);
  } catch (error) {
    console.error("Error downloading draft:", error);
  }
}

type DraftDisplayProps = {
  drafts: [DocumentDraftResponse, DocumentDraftHistory[]][];
  showCustomPrompt: { [key: number]: boolean };
  onToggleCustomPrompt: (draftId: number, show: boolean) => void;
  onUpdateDraft: (draft: DocumentDraftResponse) => (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onSelectVersion: (versionId: number) => void;
  onDownload: (draft: DocumentDraftResponse, e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
};

function DraftDisplay({
  drafts,
  showCustomPrompt,
  onToggleCustomPrompt,
  onUpdateDraft,
  onSelectVersion,
  onDownload,
}: DraftDisplayProps) {
  const activeDrafts = drafts.filter((draft) => draft[0].id !== 0);

  if (activeDrafts.length === 0) {
    return null;
  }

  return (
    <div>
      {activeDrafts.map((draft, index) => {
        const currentDraft = draft[0];
        const currentDraftHistory = draft[1];

        return (
          <div key={currentDraft.id} className={index > 0 ? "mt-8 border-t border-gray-200 pt-6" : ""}>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-adaptive">{docTypeToText(currentDraft.document.type)}</h3>
              <HistoryDropdown
                history={currentDraftHistory}
                currentDraftId={currentDraft.id}
                onSelectVersion={onSelectVersion}
              />
            </div>
            <form onSubmit={onUpdateDraft(currentDraft)}>
              <div className="mb-3">
                <label htmlFor={`version-name-${index}`} className="mb-1 block text-adaptive-label">
                  Version Name (optional)
                </label>
                <Textarea
                  id={`version-name-${index}`}
                  name="draftName"
                  placeholder="e.g. Final Draft, Tech Focus, Manager Position..."
                  rows={1}
                  defaultValue={currentDraft.version_name}
                />
              </div>
              <label htmlFor={`markdown-${index}`} className="mb-1 block text-adaptive-label">
                Content
              </label>
              <Textarea id={`markdown-${index}`} name="markdown" rows={8} defaultValue={currentDraft.markdown} />
              {showCustomPrompt[currentDraft.id] ? (
                <div className="mt-3">
                  <label htmlFor={`instructions-${index}`} className="mb-1 block text-adaptive-label">
                    Instructions (optional)
                  </label>
                  <Textarea
                    id={`instructions-${index}`}
                    name="instructions"
                    placeholder="e.g. Make it more concise, emphasize leadership..."
                    rows={3}
                    className="mt-1"
                  />
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    className="mt-1"
                    onClick={() => onToggleCustomPrompt(currentDraft.id, false)}
                  >
                    Remove instructions
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  className="mt-3"
                  onClick={() => onToggleCustomPrompt(currentDraft.id, true)}
                >
                  + Add instructions (optional)
                </Button>
              )}
              <div className="mt-4 flex gap-3">
                <Button type="submit">Update {docTypeToText(currentDraft.document.type)}</Button>
                <Button type="button" color="gray" onClick={(e) => onDownload(currentDraft, e)}>
                  Download PDF
                </Button>
              </div>
            </form>
          </div>
        );
      })}
    </div>
  );
}

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

  // async function getTestDrafts() {
  //   const response = await api.get(`api/document-version/1/`);
  //   responseErrorHandler(response);
  //   const doc_draft = response.data as DocumentDraftResponse[];
  //   console.log("!!!!!! doc_draft", doc_draft);
  //   type DocumentDraftResponse = {
  //     id: number;
  //     markdown: string;
  //     version_name: string;
  //     document: {
  //       id: number;
  //       type: string;
  //     };
  //     created_at: string;
  //   };
  //   setResumeDraftResponse({
  //     id: doc_draft.id,
  //     markdown: doc_draft.markdown,
  //     version_name: doc_draft.version_name,
  //     document: {
  //       id: doc_draft.document.id,
  //       type: "resume",
  //     },
  //     created_at: doc_draft.created_at,
  //   } as DocumentDraftResponse);
  // }
  // useEffect(() => {
  //   getTestDrafts();
  // }, []);

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
    } catch (error) {
      console.error(error);
      console.log("payload:", payload);
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
      } catch (error) {
        console.error("Error updating draft:", error);
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
      const downloadResponse = await api.get(`/api/document-version/${finalDraftId}/pdf/`, { responseType: "blob" });

      // Create blob and trigger download
      const blob = new Blob([downloadResponse.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${draft.version_name || docTypeToText(draft.document.type)}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleSelectVersion = async (versionId: number) => {
    try {
      const response = await api.get(`api/document-version/${versionId}/`);
      responseErrorHandler(response);
      const newDraft = arrayProof(response.data) as DocumentDraftResponse[];
      handleNewDraft(newDraft);
    } catch (error) {
      console.error("Error selecting version:", error);
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
          onSelectVersion={handleSelectVersion}
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
