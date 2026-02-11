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
import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { Select } from "flowbite-react";
import DisplayDrafts from "./DisplayDrafts";

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
}: {
  user_context_id: number;
  job_description_id: number;
  onMissingSelection?: (missing: "job" | "resume") => void;
}) {
  const [displayResumeDraft, setDisplayResumeDraft] = useState<DraftResponse | null>(null);
  const [displayCoverLetterDraft, setDisplayCoverLetterDraft] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerateRequest, setLastGenerateRequest] = useState<generateRequest>();
  const [generateMessages, setGenerateMessages] = useState<Partial<Record<number, string>>>({});

  // backend now returns on generate
  // {
  //   "document_version": { "id": 1, "markdown": "...", "document": { "id": 1, "type": "resume" } },
  //   "message": "returned existing document"
  // }

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

  function handleRegenerate(documentType?: DocumentType) {
    const command =
      documentType !== undefined
        ? documentType === "resume"
          ? "generate_resume"
          : "generate_cover_letter"
        : lastGenerateRequest?.command;
    if (command) runGenerate({ command, regenerateVersion: true });
  }

  const setDisplayDrafts = (draft: DraftResponse) => {
    if (draft.document.type === "resume") {
      setDisplayResumeDraft(draft);
    } else if (draft.document.type === "cover_letter") {
      setDisplayCoverLetterDraft(draft);
    } else {
      console.log("!!!SET DRAFT Function called with invalid document type:", draft.document.type);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
            {error === "Document was already generated" && lastGenerateRequest && (
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
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? "Generating..." : "Generate"}
          </Button>
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
    </div>
  );
}
