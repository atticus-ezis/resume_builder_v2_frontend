import { api } from "@/app/api";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Spinner } from "flowbite-react";
import { useState, useEffect, useRef } from "react";
import { Select } from "flowbite-react";
import DisplayDrafts from "./DisplayDrafts";
import type { Job } from "./AddJob";
import { formatDate } from "@/app/lib/formatDate";
import { pollTaskResult } from "@/app/utils/pollTaskResult";

export type DocumentType = "resume" | "cover_letter";

export type DraftResponse = {
  id: number;
  markdown: string;
  version_name: string;
  document: {
    id: number;
    type: DocumentType;
  };
  updated_at: string;
};

export type DraftHistory = {
  id: number;
  version_name: string;
  version_type: string;
  updated_at: string;
};

type GenerateDocumentsResponseItem = {
  document_version: DraftResponse;
  message?: string | null;
};

type generateRequest = {
  user_context_id: number;
  job_description_id: number;
  command: string;
};

// 1 generateDocuments
export default function GenerateDocuments({
  user_context_id,
  job_description_id,
  onMissingSelection,
  onJobSelect,
}: {
  user_context_id: number;
  job_description_id: number;
  onMissingSelection?: (missing: "job" | "resume") => void;
  onJobSelect?: (job: Job | null) => void;
}) {
  const [displayResumeDraft, setDisplayResumeDraft] = useState<DraftResponse | null>(null);
  const [displayCoverLetterDraft, setDisplayCoverLetterDraft] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerateRequest, setLastGenerateRequest] = useState<generateRequest>();
  const [generateMessages, setGenerateMessages] = useState<Partial<Record<number, string>>>({});
  const [draftHistory, setDraftHistory] = useState<DraftHistory[] | []>([]);
  const [showExistingDocsModal, setShowExistingDocsModal] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }

  // sets returned doc version, message and last command
  function processGenerateResult(result: GenerateDocumentsResponseItem[], baseRequest: generateRequest) {
    for (const item of result) {
      const documentVersion = item.document_version;
      if (item.message) {
        setGenerateMessages((prev) => ({ ...prev, [documentVersion.id]: item.message! }));
      }
      if (documentVersion.document.type === "resume") {
        setDisplayResumeDraft(documentVersion);
      } else if (documentVersion.document.type === "cover_letter") {
        setDisplayCoverLetterDraft(documentVersion);
      }
    }
    setLastGenerateRequest(baseRequest);
  }

  // logic that calls generate command
  async function runGenerate({ command, regenerateVersion = false }: { command: string; regenerateVersion?: boolean }) {
    setLoading(true);
    setError(null);
    setGenerateMessages({});

    const baseRequest: generateRequest = {
      job_description_id,
      user_context_id,
      command,
    };
    const payload = {
      ...baseRequest,
      ...(regenerateVersion && { regenerate_version: true }),
    };

    if (
      !regenerateVersion &&
      lastGenerateRequest &&
      JSON.stringify(lastGenerateRequest) === JSON.stringify(baseRequest)
    ) {
      setLoading(false);
      setError("Document has already been generated");
      return;
    }

    try {
      const response = await api.post(`api/generate-resume-and-cover-letter/`, payload);
      const { task_id } = response.data as { task_id: string };
      console.log("!!!!! task_id: ", task_id);

      pollingIntervalRef.current = pollTaskResult<GenerateDocumentsResponseItem[]>({
        taskId: task_id,
        onSuccess: (result) => {
          stopPolling();
          processGenerateResult(result, baseRequest);
          setLoading(false);
        },
        onFailure: (error) => {
          stopPolling();
          setError(error);
          setLoading(false);
        },
        onError: () => {
          stopPolling();
          setLoading(false);
        },
      });
    } catch {
      setLoading(false);
      // Toast shown by api interceptor
    }
  }

  // calls run generate if info is present else sets errors
  async function createDrafts(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!job_description_id) {
      onMissingSelection?.("job");
      return;
    }
    if (!user_context_id) {
      onMissingSelection?.("resume");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const command = (formData.get("command") as string) || "generate_resume";
    await runGenerate({ command });
  }

  //calls run generate with regenerateVersion set to true
  function handleRegenerate(documentType?: DocumentType) {
    const command =
      documentType !== undefined
        ? documentType === "resume"
          ? "generate_resume"
          : "generate_cover_letter"
        : lastGenerateRequest?.command;
    if (command) runGenerate({ command, regenerateVersion: true });
  }

  // sets generate document to their useState
  const setDisplayDrafts = (draft: DraftResponse) => {
    if (draft.document.type === "resume") {
      setDisplayResumeDraft(draft);
    } else if (draft.document.type === "cover_letter") {
      setDisplayCoverLetterDraft(draft);
    } else {
      console.log("!!!SET DRAFT Function called with invalid document type:", draft.document.type);
    }
  };

  // next application:
  // this function resets job_description_id and clears the displayResumeDraft and displayCoverLetterDraft
  function handleNextApplication() {
    onJobSelect?.(null);
    setDisplayResumeDraft(null);
    setDisplayCoverLetterDraft(null);
    setLastGenerateRequest?.({} as generateRequest);
  }

  // select existing
  // view existing document versions by and set the useStates
  async function handleHistorySelect() {
    setLoading(true);
    const history_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/document-version-history/`;
    try {
      const responseHistory = await api.get(history_url);
      const responseHistoryData = responseHistory.data as DraftHistory[];
      setDraftHistory(responseHistoryData);
    } catch {
      // generic toast
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    handleHistorySelect();
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  async function selectDraft(draftID: number) {
    const draft_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/document-version/${draftID}/`;

    try {
      const responseDraft = await api.get(draft_url);
      const responseDraftData = responseDraft.data as DraftResponse;
      setDisplayDrafts(responseDraftData);
      setShowExistingDocsModal(false);
    } catch {
      // generic toast
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
            {error && lastGenerateRequest && (
              <>
                {" "}
                <button type="button" className="font-medium underline ml-1" onClick={() => handleRegenerate()}>
                  Regenerate fresh?
                </button>
              </>
            )}
          </p>
        </div>
      )}
      <div>
        <form onSubmit={createDrafts} className="flex flex-col gap-3">
          <label htmlFor="command-select" className="text-adaptive-label">
            Select Document Type:
          </label>
          <Select id="command-select" name="command" defaultValue="generate_resume" disabled={loading}>
            <option value="generate_resume">Resume</option>
            <option value="generate_cover_letter">Cover Letter</option>
            <option value="generate_both">Both</option>
          </Select>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading} className="w-fit">
              {loading ? (
                <>
                  <Spinner aria-label="Generating" size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
            {draftHistory.length > 0 && (
              <>
                <span className="text-gray-500 dark:text-gray-400">or</span>
                <Button
                  type="button"
                  onClick={() => setShowExistingDocsModal(true)}
                  color="gray"
                  outline
                  className="w-fit"
                  disabled={loading}
                >
                  Select from existing documents
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
      {(displayResumeDraft || displayCoverLetterDraft) && (
        <div>
          <DisplayDrafts
            displayResumeDraft={displayResumeDraft}
            displayCoverLetterDraft={displayCoverLetterDraft}
            setDisplayDrafts={setDisplayDrafts}
            generateMessages={generateMessages}
          />
        </div>
      )}
      {(displayResumeDraft !== null || displayCoverLetterDraft !== null) && (
        <Button type="button" onClick={handleNextApplication} disabled={loading} className="w-fit">
          Next Application
        </Button>
      )}

      {/* Existing Documents Modal */}
      <Modal show={showExistingDocsModal} onClose={() => setShowExistingDocsModal(false)}>
        <ModalHeader>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">Existing Documents</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {draftHistory.length} document{draftHistory.length !== 1 ? "s" : ""}
            </span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {draftHistory.map((draft) => {
              const isResume = draft.version_type === "resume";
              const displayType = isResume ? "Resume" : "Cover Letter";
              const badgeColor = isResume
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
              const borderColor = isResume
                ? "border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
                : "border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20";

              return (
                <div
                  key={draft.id}
                  onClick={() => selectDraft(draft.id)}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${borderColor}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">{draft.version_name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${badgeColor}`}>{displayType}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated {formatDate(draft.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setShowExistingDocsModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
