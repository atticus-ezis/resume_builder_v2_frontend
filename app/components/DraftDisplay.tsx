"use client";
import { api } from "@/app/api";
import { useState } from "react";
import { Select, Button, Textarea } from "flowbite-react";
import PaginationModal from "@/app/components/PaginationModal";
import { formatDate } from "@/app/lib/formatDate";

export type DocumentDraftResponse = {
  id: number;
  markdown: string;
  version_name: string;
  document: {
    id: number;
    type: string;
  };
  created_at: string;
};

export type DocumentDraftHistory = {
  id: number;
  version_name: string;
  created_at: string;
};

type PaginatedDraftHistory = {
  count: number;
  results: DocumentDraftHistory[];
  next: string;
  previous: string;
};

type HistoryDropdownProps = {
  history: DocumentDraftHistory[];
  currentDraftId: number;
  documentId: number;
  onSelectVersion: (versionId: number) => void;
};

function HistoryDropdown({ history, currentDraftId, documentId, onSelectVersion }: HistoryDropdownProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paginatedHistory, setPaginatedHistory] = useState<PaginatedDraftHistory>({
    count: 0,
    results: [],
    next: "",
    previous: "",
  });

  async function fetchDraftHistory(url: string | null) {
    if (!url) {
      url = `/api/document/${documentId}/versions/`;
    }
    try {
      const response = await api.get(url);
      if (response.status === 200 && response.data.count > 0) {
        setPaginatedHistory(response.data);
      }
    } catch {
      // Toast shown by api interceptor
    }
  }

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    onSelectVersion(Number(e.target.value));
  }

  function handleViewAllVersions() {
    setShowHistoryModal(true);
    fetchDraftHistory(null);
  }

  function handleSelectFromModal(version: DocumentDraftHistory) {
    onSelectVersion(version.id);
    setShowHistoryModal(false);
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {history.length > 1 && (
          <>
            <label htmlFor={`version-select-${documentId}`} className="text-adaptive-label">
              Drafts:
            </label>
            <Select id={`version-select-${documentId}`} value={currentDraftId} onChange={handleSelect} sizing="sm">
              {history.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.version_name || `Draft ${item.id}`}
                </option>
              ))}
            </Select>
          </>
        )}
        <Button size="xs" color="gray" outline onClick={handleViewAllVersions}>
          View All Versions
        </Button>
      </div>

      <PaginationModal<DocumentDraftHistory>
        title="Draft History"
        paginationData={paginatedHistory}
        renderItem={(draft) => (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900 dark:text-white">
              {draft.version_name || `Draft ${draft.id}`}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 justify-end">{formatDate(draft.created_at)}</span>
          </div>
        )}
        onSelect={handleSelectFromModal}
        show={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onPageChange={fetchDraftHistory}
      />
    </>
  );
}

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

export type DraftDisplayProps = {
  drafts: [DocumentDraftResponse, DocumentDraftHistory[]][];
  showCustomPrompt: { [key: number]: boolean };
  onToggleCustomPrompt: (draftId: number, show: boolean) => void;
  onUpdateDraft: (draft: DocumentDraftResponse) => (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onDraftChange: (drafts: DocumentDraftResponse[]) => void;
  onDownload: (draft: DocumentDraftResponse, e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
};

export default function DraftDisplay({
  drafts,
  showCustomPrompt,
  onToggleCustomPrompt,
  onUpdateDraft,
  onDraftChange,
  onDownload,
}: DraftDisplayProps) {
  const activeDrafts = drafts.filter((draft) => draft[0].id !== 0);
  const [resumeDraftHistory, setResumeDraftHistory] = useState<DocumentDraftHistory[]>({});

  const handleSelectVersion = async (versionId: number) => {
    try {
      const response = await api.get(`api/document-version/${versionId}/`);
      if (response.status === 200) {
        const draft_response_format = {
          id: response.data.id,
          markdown: response.data.markdown,
          version_name: response.data.version_name,
          document: {
            id: response.data.document,
            type: response.data.document_type,
          },
          created_at: response.data.created_at,
        } as DocumentDraftResponse;

        onDraftChange([draft_response_format]);
      }
    } catch {
      // Toast shown by api interceptor
    }
  };

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
                documentId={currentDraft.document.id}
                onSelectVersion={handleSelectVersion}
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
                  <Button type="submit">Update {docTypeToText(currentDraft.document.type)}</Button>
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
