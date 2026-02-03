import { api } from "@/app/api";
import { Select, Button, Textarea } from "flowbite-react";
import { useState, useRef, useEffect, useCallback } from "react";

const DOC_TYPE_LABELS: Record<string, string> = {
  resume: "Resume",
  cover_letter: "Cover Letter",
};

function getDocumentTitle(type: string): string {
  return DOC_TYPE_LABELS[type] ?? type;
}

type SelectedResume = {
  id: number;
  name: string;
  updated_at: string;
};

type SelectedJob = {
  id: number;
  job_position: string;
  company_name: string;
};

type UpdatedFormData = {
  document_version_id: number;
  version_name?: string;
  markdown?: string;
  instructions?: string;
};

type RequestBody = {
  user_context_id: number;
  job_description_id: number;
  command: "generate_resume" | "generate_cover_letter" | "generate_both";
};

type DocumentResult = {
  markdown: string;
  document: { id: number; type: string };
  document_version: { id: number; version: number };
};

type VersionSelect = {
  versionId: number;
  versionName: string;
};

function buildUpdatePayload(form: HTMLFormElement, doc: DocumentResult): UpdatedFormData {
  const formData = new FormData(form);
  const markdown = (formData.get("markdown") as string) ?? "";
  const instructions = (formData.get("instructions") as string)?.trim() || undefined;
  const versionName = (formData.get("version_name") as string)?.trim() || undefined;
  const markdownChanged = markdown !== doc.markdown;
  return {
    document_version_id: doc.document_version.id,
    ...(versionName && { version_name: versionName }),
    ...(markdownChanged && { markdown }),
    ...(instructions !== undefined && instructions !== "" && { instructions }),
  };
}

type DocumentEditFormProps = {
  doc: DocumentResult;
  index: number;
  title: string;
  content: string;
  versionName: string;
  versions: VersionSelect[];
  onVersionChange: (versionId: number) => void;
  onContentChange: (value: string) => void;
  onVersionNameChange: (index: number, value: string) => void;
  instructionsValue: string;
  showInstructions: boolean;
  onToggleInstructions: (index: number) => void;
  onInstructionsChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, doc: DocumentResult, index: number) => void;
  isSubmitDisabled: boolean;
};

function DocumentEditForm({
  doc,
  index,
  title,
  content,
  versionName,
  versions,
  onVersionChange,
  onContentChange,
  onVersionNameChange,
  instructionsValue,
  showInstructions,
  onToggleInstructions,
  onInstructionsChange,
  onSubmit,
  isSubmitDisabled,
}: DocumentEditFormProps) {
  return (
    <div className={index > 0 ? "mt-8 border-t border-gray-200 pt-6" : ""}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {versions.length > 1 && (
          <>
            <label htmlFor={`version-select-${index}`} className="text-sm font-medium text-gray-700">
              Drafts:
            </label>
            <Select
              id={`version-select-${index}`}
              value={doc.document_version.id}
              onChange={(e) => onVersionChange(Number(e.target.value))}
            >
              {versions.map((v) => (
                <option key={v.versionId} value={v.versionId}>
                  {v.versionName || `Draft ${v.versionId}`}
                </option>
              ))}
            </Select>
          </>
        )}
      </div>
      <form onSubmit={(e) => onSubmit(e, doc, index)}>
        <div className="mb-3">
          <label htmlFor={`version-name-${index}`} className="mb-1 block text-sm font-medium text-gray-700">
            Version Name (optional)
          </label>
          <Textarea
            id={`version-name-${index}`}
            name="version_name"
            placeholder="e.g. Final Draft, Tech Focus, Manager Position..."
            rows={1}
            value={versionName}
            onChange={(e) => onVersionNameChange(index, e.target.value)}
          />
        </div>
        <label htmlFor={`markdown-${index}`} className="mb-1 block text-sm font-medium text-gray-700">
          Content
        </label>
        <Textarea
          id={`markdown-${index}`}
          name="markdown"
          rows={8}
          onChange={(e) => onContentChange(e.target.value)}
          value={content}
        />
        {showInstructions ? (
          <div className="mt-3">
            <label htmlFor={`instructions-${index}`} className="mb-1 block text-sm font-medium text-gray-700">
              Instructions (optional)
            </label>
            <Textarea
              id={`instructions-${index}`}
              name="instructions"
              placeholder="e.g. Make it more concise, emphasize leadership..."
              rows={3}
              className="mt-1"
              value={instructionsValue}
              onChange={(e) => onInstructionsChange(index, e.target.value)}
            />
            <Button type="button" color="light" size="xs" className="mt-1" onClick={() => onToggleInstructions(index)}>
              Remove instructions
            </Button>
          </div>
        ) : (
          <Button type="button" color="light" size="xs" className="mt-3" onClick={() => onToggleInstructions(index)}>
            + Add instructions (optional)
          </Button>
        )}
        <Button type="submit" className="mt-4" disabled={isSubmitDisabled}>
          Update {title}
        </Button>
      </form>
    </div>
  );
}

export default function GenerateDocuments({
  selectedResume,
  selectedJob,
}: {
  selectedResume: SelectedResume;
  selectedJob: SelectedJob;
}) {
  const [loading, setLoading] = useState(false);
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);
  const [documentTypeOrder, setDocumentTypeOrder] = useState<string[]>([]);
  const [versionsByType, setVersionsByType] = useState<Record<string, VersionSelect[]>>({});
  const [currentDocByType, setCurrentDocByType] = useState<Record<string, DocumentResult>>({});
  const [editedContentByType, setEditedContentByType] = useState<Record<string, string>>({});
  const [versionNamesByIndex, setVersionNamesByIndex] = useState<Record<number, string>>({});
  const [showInstructionsByIndex, setShowInstructionsByIndex] = useState<Record<number, boolean>>({});
  const [instructionsByIndex, setInstructionsByIndex] = useState<Record<number, string>>({});
  const generatedContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (documentTypeOrder.length > 0 && showGeneratedContent && generatedContentRef.current) {
      generatedContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [documentTypeOrder.length, showGeneratedContent]);

  const isFormChanged = useCallback(
    (doc: DocumentResult, index: number) => {
      const docType = doc.document.type;
      const editedContent = editedContentByType[docType] ?? doc.markdown;
      const markdownChanged = editedContent !== doc.markdown;
      const versionNameVal = versionNamesByIndex[index]?.trim() ?? "";
      const hasVersionName = versionNameVal !== "";
      const instructionsVal = instructionsByIndex[index]?.trim() ?? "";
      const hasInstructions = showInstructionsByIndex[index] && instructionsVal !== "";
      return markdownChanged || hasVersionName || hasInstructions;
    },
    [editedContentByType, versionNamesByIndex, instructionsByIndex, showInstructionsByIndex]
  );

  const getDocumentVersion = async (documentVersionId: number): Promise<DocumentResult | null> => {
    try {
      const response = await api.get(`/api/document-versions/${documentVersionId}/`);
      if (response.status === 200) {
        return response.data as DocumentResult;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleUpdate = useCallback(
    async (e: React.FormEvent<HTMLFormElement>, doc: DocumentResult, index: number) => {
      e.preventDefault();
      if (!isFormChanged(doc, index)) return;
      const payload = buildUpdatePayload(e.currentTarget, doc);
      try {
        const response = await api.post("/api/update-content/", payload);
        if (response.status === 200) {
          const data = (await response.data) as DocumentResult;
          const docType = doc.document.type;

          // Add new version to the list
          const versionName = payload.version_name || `Draft ${data.document_version.id}`;
          setVersionsByType((prev) => ({
            ...prev,
            [docType]: [...(prev[docType] ?? []), { versionId: data.document_version.id, versionName }],
          }));

          // Update current document and clear edited content
          setCurrentDocByType((prev) => ({ ...prev, [docType]: data }));
          setEditedContentByType((prev) => ({ ...prev, [docType]: data.markdown }));

          // Clear version name input for next update
          setVersionNamesByIndex((prev) => ({ ...prev, [index]: "" }));
        } else {
          console.error("Status, text", response.statusText);
          console.error("Status", response);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [isFormChanged]
  );

  const toggleInstructions = useCallback((index: number) => {
    setShowInstructionsByIndex((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!selectedResume.id || !selectedJob.id) {
      setLoading(false);
      return;
    }
    const formData = new FormData(e.target as HTMLFormElement);
    const command = formData.get("command") as RequestBody["command"];
    const requestBody: RequestBody = {
      user_context_id: selectedResume.id,
      job_description_id: selectedJob.id,
      command,
    };
    try {
      const response = await api.post("/api/generate-resume-and-cover-letter/", requestBody);
      if (response.status === 200) {
        const data = await response.data;
        console.log("!!!!!data", data);
        const docs = Array.isArray(data) ? data : [data];
        const expectedCount = command === "generate_both" ? 2 : 1;
        if (docs.length !== expectedCount) {
          console.error(`Expected ${expectedCount} document(s), got ${docs.length}`, docs);
          return;
        }

        const typeOrder: string[] = [];
        const versions: Record<string, VersionSelect[]> = {};
        const currentDocs: Record<string, DocumentResult> = {};
        const editedContent: Record<string, string> = {};

        for (const doc of docs as DocumentResult[]) {
          const t = doc.document.type;
          typeOrder.push(t);
          versions[t] = [{ versionId: doc.document_version.id, versionName: `Draft ${doc.document_version.id}` }];
          currentDocs[t] = doc;
          editedContent[t] = doc.markdown;
        }

        setVersionsByType(versions);
        setDocumentTypeOrder(typeOrder);
        setCurrentDocByType(currentDocs);
        setEditedContentByType(editedContent);
        setShowGeneratedContent(true);
      } else {
        console.error("Status, text", response.statusText);
        console.error("Status", response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const setContentForDocType = useCallback((docType: string, value: string) => {
    setEditedContentByType((prev) => ({ ...prev, [docType]: value }));
  }, []);

  const handleVersionChange = useCallback(async (docType: string, versionId: number) => {
    // Fetch the version data from backend
    const version = await getDocumentVersion(versionId);
    if (version) {
      setCurrentDocByType((prev) => ({ ...prev, [docType]: version }));
      setEditedContentByType((prev) => ({ ...prev, [docType]: version.markdown }));
    }
  }, []);

  const setVersionNameForIndex = useCallback((index: number, value: string) => {
    setVersionNamesByIndex((prev) => ({ ...prev, [index]: value }));
  }, []);

  const setInstructionsForIndex = useCallback((index: number, value: string) => {
    setInstructionsByIndex((prev) => ({ ...prev, [index]: value }));
  }, []);

  return (
    <div>
      <h1>Generate Resume or Cover Letter?</h1>
      <form onSubmit={handleSubmit}>
        <Select name="command" id="command">
          <option value="generate_resume">Resume</option>
          <option value="generate_cover_letter">Cover Letter</option>
          <option value="generate_both">Both</option>
        </Select>
        <Button type="submit" className="mt-4">
          Generate
        </Button>
      </form>
      {documentTypeOrder.length > 0 && showGeneratedContent && (
        <div ref={generatedContentRef} className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Generated Documents</h2>
          {documentTypeOrder.map((docType, index) => {
            const versions = versionsByType[docType] ?? [];
            const currentDoc = currentDocByType[docType];
            if (!currentDoc) return null;

            const content = editedContentByType[docType] ?? currentDoc.markdown;
            return (
              <DocumentEditForm
                key={docType}
                doc={currentDoc}
                index={index}
                title={getDocumentTitle(docType)}
                content={content}
                versionName={versionNamesByIndex[index] ?? ""}
                versions={versions}
                onVersionChange={(versionId) => handleVersionChange(docType, versionId)}
                onContentChange={(value) => setContentForDocType(docType, value)}
                onVersionNameChange={setVersionNameForIndex}
                instructionsValue={instructionsByIndex[index] ?? ""}
                showInstructions={!!showInstructionsByIndex[index]}
                onToggleInstructions={toggleInstructions}
                onInstructionsChange={setInstructionsForIndex}
                onSubmit={handleUpdate}
                isSubmitDisabled={!isFormChanged(currentDoc, index)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
