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
import { Button, Select, Textarea } from "flowbite-react";

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
  const [resumeDraftHistory, setResumeDraftHistory] = useState<DraftHistory[]>([]);
  const [coverLetterDraftHistory, setCoverLetterDraftHistory] = useState<DraftHistory[]>([]);
  const [showInstructions, setShowInstructions] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeDocumentId || coverLetterDocumentId) {
      populateHistory();
    }
  }, [displayResumeDraft, displayCoverLetterDraft]);

  // Shared: patch draft if form has version_name/markdown changes. Returns draft id to use (updated if patched).
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
  async function onHistorySelect(versionId: number, currentDraft: DraftResponse, form: HTMLFormElement | null) {
    setLoading(true);
    setError(null);
    try {
      await patchDraftIfFormChanged(currentDraft, form);
      const response = await api.get(`api/document-version/?document=${versionId}/`);
      const draft = response.data as DraftResponse;
      setDisplayDrafts(draft);
    } catch {
      // Toast shown by api interceptor
    } finally {
      setLoading(false);
    }
  }

  // 3 set populateHistory
  async function populateHistory() {
    if (resumeDocumentId) {
      const response = await api.get(`api/document-version-history/document?=${resumeDocumentId}/`);
      const draft_histories = response.data as DraftHistory[];
      for (const draft_history of draft_histories) {
        if (draft_history.document_type === "resume") {
          setResumeDraftHistory([...resumeDraftHistory, draft_history]);
        }
      }
    }
    if (coverLetterDocumentId) {
      const response = await api.get(`api/document-version-history/document?=${coverLetterDocumentId}/`);
      const draft_histories = response.data as DraftHistory[];
      for (const draft_history of draft_histories) {
        if (draft_history.document_type === "cover_letter") {
          setCoverLetterDraftHistory([...coverLetterDraftHistory, draft_history]);
        }
      }
    }
  }

  // takes changes from instructions + (title + content) and sets new Draft
  function handleUpdateDraft(draft: DraftResponse) {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const instructions = formData ? (formData.get("instructions") as string) || null : null;
      if (!instructions) {
        setError("No instructions provided");
        return;
      }
      const newDraftId = await patchDraftIfFormChanged(draft, e.currentTarget);

      try {
        setError(null);
        const response = await api.post("api/update-content/", {
          document_version_id: newDraftId,
        });
        const updatedDraft = response.data as DraftResponse;
        setDisplayDrafts(updatedDraft);
      } catch {
        // Toast shown by api interceptor
      }
    };
  }

  const handleDownload = async (draft: DraftResponse, form: HTMLFormElement | null) => {
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
    }
  };

  const draftsToShow: { draft: DraftResponse; history: DraftHistory[] }[] = [];
  if (displayResumeDraft) {
    draftsToShow.push({ draft: displayResumeDraft, history: resumeDraftHistory });
  }
  if (displayCoverLetterDraft) {
    draftsToShow.push({ draft: displayCoverLetterDraft, history: coverLetterDraftHistory });
  }

  if (draftsToShow.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      {draftsToShow.map(({ draft, history }, index) => (
        <div key={draft.id} className={index > 0 ? "border-t border-gray-200 pt-8 dark:border-gray-700" : ""}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {docTypeToText(draft.document.type)}
            </h3>
            {history.length > 0 && (
              <>
                <label htmlFor={`version-select-${draft.id}`} className="text-sm text-gray-600 dark:text-gray-400">
                  Version:
                </label>
                <Select
                  id={`version-select-${draft.id}`}
                  value={draft.id}
                  onChange={(e) => {
                    const form = e.currentTarget.closest("div")?.nextElementSibling;
                    onHistorySelect(Number(e.target.value), draft, form instanceof HTMLFormElement ? form : null);
                  }}
                  sizing="sm"
                >
                  {history.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.version_name || `Version ${item.id}`} — {DateFormatter(item.updated_at)}
                    </option>
                  ))}
                </Select>
              </>
            )}
          </div>

          <form onSubmit={handleUpdateDraft(draft)}>
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
