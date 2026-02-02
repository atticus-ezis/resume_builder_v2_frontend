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

type UpdateFormData = {
  document_version_id: number;
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

function buildUpdatePayload(form: HTMLFormElement, doc: DocumentResult): UpdateFormData {
  const formData = new FormData(form);
  const markdown = (formData.get("markdown") as string) ?? "";
  const instructions = (formData.get("instructions") as string)?.trim() || undefined;
  const markdownChanged = markdown !== doc.markdown;
  return {
    document_version_id: doc.document_version.id,
    ...(markdownChanged && { markdown }),
    ...(instructions !== undefined && instructions !== "" && { instructions }),
  };
}

type DocumentEditFormProps = {
  doc: DocumentResult;
  index: number;
  title: string;
  content: string;
  onContentChange: (type: string, value: string) => void;
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
  onContentChange,
  instructionsValue,
  showInstructions,
  onToggleInstructions,
  onInstructionsChange,
  onSubmit,
  isSubmitDisabled,
}: DocumentEditFormProps) {
  const documentType = doc.document.type;
  return (
    <div className={index > 0 ? "mt-8 border-t border-gray-200 pt-6" : ""}>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
      <form onSubmit={(e) => onSubmit(e, doc, index)}>
        <label htmlFor={`markdown-${index}`} className="sr-only">
          Content
        </label>
        <Textarea
          id={`markdown-${index}`}
          name="markdown"
          rows={8}
          onChange={(e) => onContentChange(documentType, e.target.value)}
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
  const [documents, setDocuments] = useState<DocumentResult[]>([]);
  const [documentContentByType, setDocumentContentByType] = useState<Record<string, string>>({});
  const [showInstructionsByIndex, setShowInstructionsByIndex] = useState<Record<number, boolean>>({});
  const [instructionsByIndex, setInstructionsByIndex] = useState<Record<number, string>>({});
  const generatedContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (documents.length > 0 && showGeneratedContent && generatedContentRef.current) {
      generatedContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [documents.length, showGeneratedContent]);

  const isFormChanged = useCallback(
    (doc: DocumentResult, index: number) => {
      const documentContent = documentContentByType[doc.document.type] ?? doc.markdown;
      const markdownChanged = documentContent !== doc.markdown;
      const instructionsValue = instructionsByIndex[index]?.trim() ?? "";
      const hasInstructions = showInstructionsByIndex[index] && instructionsValue !== "";
      return markdownChanged || hasInstructions;
    },
    [documentContentByType, instructionsByIndex, showInstructionsByIndex]
  );

  const handleUpdate = useCallback(
    (e: React.FormEvent<HTMLFormElement>, doc: DocumentResult, index: number) => {
      e.preventDefault();
      if (!isFormChanged(doc, index)) return;
      const payload = buildUpdatePayload(e.currentTarget, doc);
      // TODO: await api.patch("/api/update-content/", payload);
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("Update payload:", payload);
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
        const docs = Array.isArray(data) ? data : [data];
        const expectedCount = command === "generate_both" ? 2 : 1;
        if (docs.length !== expectedCount) {
          console.error(`Expected ${expectedCount} document(s), got ${docs.length}`, docs);
          return;
        }
        const contentByType: Record<string, string> = {};
        docs.forEach((doc: DocumentResult) => {
          contentByType[doc.document.type] = doc.markdown;
        });
        setDocumentContentByType(contentByType);
        setDocuments(docs);
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

  const setContentForType = useCallback((type: string, value: string) => {
    setDocumentContentByType((prev) => ({ ...prev, [type]: value }));
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
      {documents.length > 0 && showGeneratedContent && (
        <div ref={generatedContentRef} className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Generated Documents</h2>
          {documents.map((doc, index) => (
            <DocumentEditForm
              key={`${doc.document.type}-${doc.document_version.id}`}
              doc={doc}
              index={index}
              title={getDocumentTitle(doc.document.type)}
              content={documentContentByType[doc.document.type] ?? doc.markdown}
              onContentChange={setContentForType}
              instructionsValue={instructionsByIndex[index] ?? ""}
              showInstructions={!!showInstructionsByIndex[index]}
              onToggleInstructions={toggleInstructions}
              onInstructionsChange={setInstructionsForIndex}
              onSubmit={handleUpdate}
              isSubmitDisabled={!isFormChanged(doc, index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
