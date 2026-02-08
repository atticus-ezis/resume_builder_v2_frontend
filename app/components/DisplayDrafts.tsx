// function onUpdateDraft(e, draft) -> returns new displayResumeDraft or displayCoverLetterDraft
// 1) return 'none' if version_name and markdown are the same as the previous version
// 2) else create kwargs with version_name and markdown
// 3) send api.post("api/update-content/", payload);
// 4) set new displayResumeDraft or displayCoverLetterDraft

import { DraftResponse, DraftHistory } from "./AddDocuments";
import { useState, useEffect } from "react";
import { api } from "@/app/api";
import { docTypeToText } from "@/app/utils/DocTypeToText";
import { DateFormatter } from "@/app/utils/DateFormatter";
import { Button, Select, Textarea, Spinner } from "flowbite-react";

export default function DisplayDrafts({
  displayResumeDraft,
  displayCoverLetterDraft,
  setDisplayDrafts,
  resumeDocumentId,
  coverLetterDocumentId,
}: {
  displayResumeDraft: DraftResponse | null;
  displayCoverLetterDraft: DraftResponse | null;
  setDisplayDrafts: (draft: DraftResponse) => void;
  resumeDocumentId: number | null;
  coverLetterDocumentId: number | null;
}) {
  const [showInstructions, setShowInstructions] = useState<Record<number, boolean>>({});
  const [resumeDraftHistory, setResumeDraftHistory] = useState<DraftHistory[]>([]);
  const [coverLetterDraftHistory, setCoverLetterDraftHistory] = useState<DraftHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftsWithHistory: { draft: DraftResponse; draftHistory: DraftHistory[] }[] = [];
  if (displayResumeDraft) {
    draftsWithHistory.push({ draft: displayResumeDraft, draftHistory: resumeDraftHistory });
  }
  if (displayCoverLetterDraft) {
    draftsWithHistory.push({ draft: displayCoverLetterDraft, draftHistory: coverLetterDraftHistory });
  }

  // patch draft if form has version_name/markdown changes. Returns draft id to use (updated if patched).
  async function patchDraftIfFormChanged(
    draft: DraftResponse,
    form: HTMLFormElement | null,
  ): Promise<number | undefined> {
    if (!form) return draft.id;
    const formData = new FormData(form);
    const currentName = formData.get("draftName") as string;
    const currentMarkdown = formData.get("markdown") as string;
    const markdownChanged = draft.markdown !== currentMarkdown;
    const versionNameChanged = draft.version_name !== currentName;
    if (!markdownChanged && !versionNameChanged) return draft.id;
    const patchPayload: Record<string, string> = {};
    if (currentName) patchPayload.version_name = currentName;
    if (markdownChanged) patchPayload.markdown = currentMarkdown;
    try {
      const updateResponse = await api.patch(`api/document-version/${draft.id}/`, patchPayload);
      const updateData = updateResponse.data as DraftResponse;
      return updateData?.id ?? draft.id;
    } catch {
      // Toast shown by api interceptor
    }
  }

  // 2 set on History Select — patch current draft if form has changes, then load selected version
  async function onHistorySelect(currentDraft: DraftResponse, form: HTMLFormElement | null) {
    setLoading(true);
    setError(null);
    try {
      const draftId = await patchDraftIfFormChanged(currentDraft, form);
      const response = await api.get(`api/document-version/?document=${draftId}/`);
      const draft = response.data as DraftResponse;
      setDisplayDrafts(draft);
    } catch {
      // Toast shown by api interceptor
    } finally {
      setLoading(false);
    }
  }

  // 3 set populateHistory
  // async function populateHistory() {
  //   for (const draft of draftsToShow) {
  //     setDraftHistory(draft);
  //   }
  // }

  // returns and resets current document version history
  async function setDraftHistory(draft: DraftResponse) {
    const documentId = draft.document.id;
    const documentType = draft.document.type;
    const response = await api.get(`api/document-version-history/document?=${documentId}/`);
    const draft_histories = response.data as DraftHistory[];
    if (documentType === "resume") {
      setResumeDraftHistory(draft_histories);
    } else if (documentType === "cover_letter") {
      setCoverLetterDraftHistory(draft_histories);
    }
  }

  // returns new doc version and updates history and draft display
  function handleUpdateDraft(draft: DraftResponse) {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const instructions = formData ? (formData.get("instructions") as string) || null : null;
      if (!instructions) {
        setError("No instructions provided");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const newDraftId = await patchDraftIfFormChanged(draft, e.currentTarget);
        const response = await api.post("api/update-content/", {
          document_version_id: newDraftId,
        });
        const updatedDraft = response.data as DraftResponse;
        setDisplayDrafts(updatedDraft);
        setDraftHistory(updatedDraft);
      } catch {
        // Toast shown by api interceptor
      } finally {
        setLoading(false);
      }
    };
  }

  const handleDownload = async (draft: DraftResponse, form: HTMLFormElement | null) => {
    setLoading(true);
    try {
      const draftIdForPdf = await patchDraftIfFormChanged(draft, form);

      const downloadResponse = await api.get(`/api/document-version/${draftIdForPdf}/pdf/`, {
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
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Toast shown by api interceptor
    } finally {
      setLoading(false);
    }
  };

  // const draftsToShow: { draft: DraftResponse; history: DraftHistory[] }[] = [];
  // if (displayResumeDraft) {
  //   draftsToShow.push({ draft: displayResumeDraft, history: resumeDraftHistory });
  // }
  // if (displayCoverLetterDraft) {
  //   draftsToShow.push({ draft: displayCoverLetterDraft, history: coverLetterDraftHistory });
  // }

  // if (draftsToShow.length === 0) {
  //   return null;
  // }

  return (
    <div className="relative space-y-8">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100/80 dark:bg-gray-900/80">
          <Spinner size="xl" />
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      {draftsWithHistory.map(({ draft, draftHistory }, index) => (
        <div
          key={draft.id}
          className={`relative ${index > 0 ? "border-t border-gray-200 pt-8 dark:border-gray-700" : ""} ${loading ? "pointer-events-none opacity-70" : ""}`}
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {docTypeToText(draft.document.type)}
            </h3>
            {draftHistory.length > 0 && (
              <>
                <label htmlFor={`version-select-${draft.id}`} className="text-sm text-gray-600 dark:text-gray-400">
                  Version:
                </label>
                <Select
                  id={`version-select-${draft.id}`}
                  value={draft.id}
                  onChange={() => {
                    const form = document.getElementById(`draft-form-${draft.id}`);
                    onHistorySelect(draft, form instanceof HTMLFormElement ? form : null);
                  }}
                  sizing="sm"
                >
                  {draftHistory.map((pastDraft: DraftHistory) => (
                    <option key={pastDraft.id} value={pastDraft.id}>
                      {pastDraft.version_name || `Version ${pastDraft.id}`} — {DateFormatter(pastDraft.updated_at)}
                    </option>
                  ))}
                </Select>
              </>
            )}
          </div>

          <form id={`draft-form-${draft.id}`} onSubmit={handleUpdateDraft(draft)}>
            <div className="mb-3">
              <label
                htmlFor={`draftName-${draft.id}`}
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Version Name (optional)
              </label>
              <Textarea
                id={`draftName-${draft.id}`}
                name="draftName"
                placeholder="e.g. Final Draft, Tech Focus..."
                rows={1}
                defaultValue={draft.version_name}
                className="w-full"
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor={`markdown-${draft.id}`}
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Content
              </label>
              <Textarea
                id={`markdown-${draft.id}`}
                name="markdown"
                rows={10}
                defaultValue={draft.markdown}
                className="w-full"
              />
            </div>

            {showInstructions[draft.id] ? (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <label
                  htmlFor={`instructions-${draft.id}`}
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Instructions (optional)
                </label>
                <Textarea
                  id={`instructions-${draft.id}`}
                  name="instructions"
                  placeholder="e.g. Make it more concise, emphasize leadership..."
                  rows={3}
                  className="mb-3 w-full"
                />
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    color="light"
                    size="sm"
                    onClick={() => setShowInstructions((prev) => ({ ...prev, [draft.id]: false }))}
                  >
                    Close
                  </Button>
                  <Button type="submit" size="sm">
                    Update {docTypeToText(draft.document.type)}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                color="light"
                size="xs"
                className="mt-2"
                onClick={() => setShowInstructions((prev) => ({ ...prev, [draft.id]: true }))}
              >
                + Add instructions (optional)
              </Button>
            )}

            <div className="mt-4">
              <Button
                type="button"
                color="gray"
                onClick={(e) => {
                  const form = e.currentTarget.closest("form");
                  handleDownload(draft, form instanceof HTMLFormElement ? form : null);
                }}
              >
                Download PDF
              </Button>
            </div>
          </form>
        </div>
      ))}
    </div>
  );
}
