"use client";

import { useState, useEffect } from "react";
import { api } from "@/app/api";
import { Button, TextInput, Select, Spinner, Card } from "flowbite-react";
import { DateFormatter } from "@/app/utils/DateFormatter";
import DisplayDrafts from "@/app/components/DisplayDrafts";
import { DraftResponse, DocumentType } from "@/app/components/AddDocuments";

// Types for the document list
type DocumentListItem = {
  id: number;
  document_type: DocumentType;
  company_name: string;
  job_position: string;
  created_at: string;
};

type PaginatedDocuments = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DocumentListItem[];
};

// Types for document detail
type DocumentVersion = {
  id: number;
  version_name: string;
  created_at: string;
  updated_at: string;
};

type DocumentDetail = {
  id: number;
  company_name: string;
  job_position: string;
  document_type: DocumentType;
  created_at: string;
  final_version: DocumentVersion | null;
  versions: DocumentVersion[];
};

export default function ResumesPage() {
  // List view state
  const [documents, setDocuments] = useState<PaginatedDocuments | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  
  // Detail view state
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DraftResponse | null>(null);
  
  // View state: 'list' | 'detail' | 'version'
  const [view, setView] = useState<"list" | "detail" | "version">("list");

  // Load documents list
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async (url?: string) => {
    setLoading(true);
    try {
      const endpoint = url || `api/document/?ordering=${ordering}${searchQuery ? `&search=${searchQuery}` : ""}`;
      const response = await api.get(endpoint);
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadDocuments();
  };

  const handleOrderingChange = (newOrdering: string) => {
    setOrdering(newOrdering);
    // Reload with new ordering
    setTimeout(() => {
      loadDocuments();
    }, 0);
  };

  const handleDocumentClick = async (documentId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`api/document/${documentId}/`);
      setSelectedDocument(response.data);
      setView("detail");
    } catch (error) {
      console.error("Failed to load document details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionClick = async (versionId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`api/document-version/${versionId}/`);
      setSelectedVersion(response.data);
      setView("version");
    } catch (error) {
      console.error("Failed to load version:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedDocument(null);
    setSelectedVersion(null);
  };

  const handleBackToDetail = () => {
    setView("detail");
    setSelectedVersion(null);
  };

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resumes</h1>
      </div>

      {/* Search and ordering controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Search by company or position
          </label>
          <TextInput
            id="search"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="w-full md:w-48">
          <label htmlFor="ordering" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by
          </label>
          <Select id="ordering" value={ordering} onChange={(e) => handleOrderingChange(e.target.value)}>
            <option value="-created_at">Newest first</option>
            <option value="created_at">Oldest first</option>
          </Select>
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="xl" />
        </div>
      ) : documents && documents.results.length > 0 ? (
        <>
          <div className="space-y-3">
            {documents.results.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleDocumentClick(doc.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{doc.company_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doc.job_position}</p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      Created: {DateFormatter(doc.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {doc.document_type === "resume" ? "Resume" : "Cover Letter"}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {documents.count > 10 && (
            <div className="flex justify-center gap-2">
              <Button
                color="gray"
                outline
                disabled={!documents.previous}
                onClick={() => documents.previous && loadDocuments(documents.previous)}
              >
                Previous
              </Button>
              <Button
                color="gray"
                outline
                disabled={!documents.next}
                onClick={() => documents.next && loadDocuments(documents.next)}
              >
                Next
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {documents.results.length} of {documents.count} result{documents.count !== 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No documents found. Try adjusting your search.</p>
        </div>
      )}
    </div>
  );

  // Render document detail view
  const renderDetailView = () => {
    if (!selectedDocument) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button color="gray" size="sm" onClick={handleBackToList}>
            ← Back to list
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedDocument.company_name}</h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">{selectedDocument.job_position}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Created: {DateFormatter(selectedDocument.created_at)}
          </p>
        </div>

        {/* Final version */}
        {selectedDocument.final_version && (
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Final Version</h2>
            <Button color="blue" onClick={() => handleVersionClick(selectedDocument.final_version!.id)}>
              {selectedDocument.final_version.version_name || `Version ${selectedDocument.final_version.id}`}
            </Button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Updated: {DateFormatter(selectedDocument.final_version.updated_at)}
            </p>
          </Card>
        )}

        {/* All versions */}
        {selectedDocument.versions.length > 0 && (
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              All Versions ({selectedDocument.versions.length})
            </h2>
            <div className="space-y-2">
              {selectedDocument.versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {version.version_name || `Version ${version.id}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Updated: {DateFormatter(version.updated_at)}
                    </p>
                  </div>
                  <Button size="xs" color="gray" onClick={() => handleVersionClick(version.id)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  // Render version view (using DisplayDrafts)
  const renderVersionView = () => {
    if (!selectedVersion) return null;

    const isResume = selectedVersion.document.type === "resume";

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button color="gray" size="sm" onClick={handleBackToDetail}>
            ← Back to document
          </Button>
          <Button color="gray" size="sm" onClick={handleBackToList}>
            ← Back to list
          </Button>
        </div>

        <DisplayDrafts
          displayResumeDraft={isResume ? selectedVersion : null}
          displayCoverLetterDraft={!isResume ? selectedVersion : null}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        {loading && view !== "list" ? (
          <div className="flex justify-center py-12">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            {view === "list" && renderListView()}
            {view === "detail" && renderDetailView()}
            {view === "version" && renderVersionView()}
          </>
        )}
      </div>
    </div>
  );
}
