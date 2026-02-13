// async function handleGenerateCommand(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);

//     if (!job_description_id) {
//       setLoading(false);
//       onMissingSelection?.("job");
//       return;
//     }
//     if (!user_context_id) {
//       setLoading(false);
//       onMissingSelection?.("resume");
//       return;
//     }

/// function handleGenerateCommand -->
// 1) the function takes job_description_id and user_context_id and onMissingSelection. whichever is missing, set to onMissingSelection
// 2) response will be an array so iterate through --> set (displayResumeDraft + displayCoverLetterDraft)
// 3) use function addDraftHistory and that formats response then sets (resumeDraftHistory + coverLetterDraftHistory)

/// useState: displayResumeDraft + displayCoverLetterDraft --> has this type:
// {
//  id: 0,
//  markdown: "",
//  version_name: "",
//  document: {
//   id: 0,
//   type: "",
//  },
//  created_at: "",
// };
//
// useState: displayResumeHistory + displayCoverLetterHistory --> has this type:
// {
//  id: 0,
//  version_name: "",
//  created_at: "",
// }[];
//
//

/// function onHistorySelect -> sets displayResumeDraft + displayCoverLetterDraft
// 1) get ID
// 2) get api/document-version/document?={id}/ --> set displayResumeDraft + displayCoverLetterDraft
//

// function onUpdateDraft(e, draft) -> returns new displayResumeDraft or displayCoverLetterDraft
// 1) return 'none' if version_name and markdown are the same as the previous version
// 2) else create kwargs with version_name and markdown
// 3) send api.post("api/update-content/", payload);
// 4) set new displayResumeDraft or displayCoverLetterDraft
//

// function createDownloadButton(e, draft) -> returns new displayResumeDraft or displayCoverLetterDraft
// 1) if kwargs exist [version_name, markdown] --> then patch existing version
// 2) then pass id to api.patch("api/document-version/{id}/pdf/", payload);
// 3) handle response

// function DisplayDraft -> renders displayResumeDraft or displayCoverLetterDraft --> call on useEffect whenever set (displayResumeDraft or displayCoverLetterDraft) is changed
// 1) render items in an array, display doc type displayResumeDraft or displayCoverLetterDraft
// 2) form with (version_name, markdown, instructions) that triggers onUpdate
// 3) have an instructions field that toggles a custom instruction prompt modal. display the update "submit" type button here
// 4) display the "download" type button here

import { api } from "@/app/api";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import { useState, useEffect } from "react";
import { Select } from "flowbite-react";
import DisplayDrafts from "./DisplayDrafts";
import type { Job } from "./AddJob";
import { formatDate } from "@/app/lib/formatDate";

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

  // sets displayResume + coverLetter and lastGenerateRequest
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
      const draft_responses = response.data as GenerateDocumentsResponseItem[];
      for (const item of draft_responses) {
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
    } catch {
      // Toast shown by api interceptor
    } finally {
      setLoading(false);
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
              {loading ? "Generating..." : "Generate"}
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
