import { api } from "@/app/api";
import { Select, Button } from "flowbite-react";
import { useState } from "react";

// 1) Generate initial Document
// get payload: inherit ids from parent. prompt a new "command" value with choices "generate_resume" | "generate_cover_letter" | "generate_both"
// payload = {user_context_id, job_description_id, command"}
// POST url = api/generate-resume-and-cover-letter/
// response = [{"id", "markdown", "document":{"id", "type"}, "version_name"}...] response.length === 2 if command is "generate_both"

// 2) Store this response. It appears often
// type DraftResponse = ["id", "markdown", "document":{"id", "type"}, "version_name"]
// becuase two can exist use both resumeDraftResponse and coverLetterDraftResponse
// Update draft histories for each. type DraftHistory = ["id", "version_name", "created_at"] --> resumeDraftHistory and coverLetterDraftHistory
// Update display draft response with the new values

// 3) Display Draft(s) in a new <div>.
// will be passed either resumeDraftResponse and or coverLetterDraftResponse if either exist
// Create form with inputs for Drafts. These values will change -> "version_name", "markdown", "instructions"
// a) handleSubmit:
// payload = {document_version_id, version_name, markdown (optional), instructions (optional)}
// POST url = api/update-content -- use "create new draft" button
// response = ["id", "markdown", "document":{"id", "type"}, "version_name"]
// repeat step 2

// 4) Manage Draft histories
// store an array of ["id", "version_name", "created_at"] for each Draft
// create a selectable dropdown for the Draft histories
// onSelect:
// GET url = api/document-version/{document_version_id}
// response = {
//   "id": 0,
//   "document": 0,
//   "version_number": 0,
//   "markdown": "string",
//   "created_at": "2026-02-02T13:04:54.374Z"
// }
// clean response and send to repeat 2

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

type DraftResponseList = {
  resume: DocumentDraftResponse;
  coverLetter: DocumentDraftResponse;
};

export default function GenerateDocumentsNew(user_context_id: number, job_description_id: number) {
  const [resumeDraftResponse, setResumeDraftResponse] = useState<DocumentDraftResponse>(blankDocumentDraftResponse);
  const [coverLetterDraftResponse, setCoverLetterDraftResponse] =
    useState<DocumentDraftResponse>(blankDocumentDraftResponse);

  const [resumeDraftHistory, setResumeDraftHistory] = useState<DocumentDraftHistory[]>([]);
  const [coverLetterDraftHistory, setCoverLetterDraftHistory] = useState<DocumentDraftHistory[]>([]);

  async function handleGenerateCommand(e: React.ChangeEvent<HTMLFormElement>) {
    if (!user_context_id || !job_description_id) {
      return;
    }
    const command = e.target.value;
    const payload = { user_context_id, job_description_id, command };
    try {
      const response = await api.post(`api/generate-resume-and-cover-letter/`, {
        payload,
      });
      const doc_versions = response.data; // array
      const expected_length = command === "generate_both" ? 2 : 1;
      if (doc_versions.length !== expected_length) {
        throw new Error("Expected " + expected_length + " documents, got " + doc_versions.length);
      }
      for (const doc_version of doc_versions) {
        handleNewDraft(doc_version);
      }
    } catch (error) {
      console.error(error);
      console.log("payload:", payload);
    }
  }

  function handleNewDraft(draft: DocumentDraftResponse) {
    if (draft.document.type === "resume") {
      setResumeDraftResponse(draft);
      setResumeDraftHistory([
        ...resumeDraftHistory,
        { id: draft.id, version_name: draft.version_name, created_at: draft.created_at },
      ]);
    } else if (draft.document.type === "cover_letter") {
      setCoverLetterDraftResponse(draft);
      setCoverLetterDraftHistory([
        ...coverLetterDraftHistory,
        { id: draft.id, version_name: draft.version_name, created_at: draft.created_at },
      ]);
    }
  }

  function DraftDisplay({ resume, coverLetter }: DraftResponseList) {
    if (!resume && !coverLetter) {
      return;
    }
    const drafts = [];

    return <div>Hello</div>;
  }

  return (
    <div>
      <h1>Generate Resume or Cover Letter</h1>
      <form onSubmit={handleGenerateCommand}>
        <Select>
          <option value="generate_resume">Resume</option>
          <option value="generate_cover_letter">Cover Letter</option>
          <option value="generate_both">Both</option>
        </Select>
        <Button type="submit">Generate</Button>
      </form>
      <div>
        <DraftDisplay resume={resumeDraftResponse} coverLetter={coverLetterDraftResponse} />
      </div>
    </div>
  );
}
