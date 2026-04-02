/** Source types that feed the knowledge index */
export type KnowledgeSourceType = 'document' | 'finding' | 'answer' | 'conclusion' | 'report';

/** A searchable document entry in the knowledge index */
export interface KnowledgeDocumentEntry {
  id: string;
  fileName?: string;
  sourceType: KnowledgeSourceType;
  sourceId?: string; // findingId, questionId, etc.
  uploadedBy?: string;
  uploadedAt: string;
  fileSize?: number;
  mimeType?: string;
  chunkCount?: number;
  blobPath?: string;
}

/** A search result chunk with source attribution */
export interface KnowledgeSearchResult {
  id: string;
  documentId: string;
  text: string;
  sourceType: KnowledgeSourceType;
  score: number;
  metadata: {
    fileName?: string;
    page?: number;
    section?: string;
    findingId?: string;
    questionId?: string;
  };
}

/** Options for knowledge search */
export interface KnowledgeSearchOptions {
  sourceTypes?: KnowledgeSourceType[];
  topK?: number;
  projectFilter?: string[];
}

/** Abstract interface for knowledge search backends */
export interface KnowledgeAdapter {
  search(
    projectId: string,
    query: string,
    options?: KnowledgeSearchOptions
  ): Promise<KnowledgeSearchResult[]>;
  list(projectId: string): Promise<KnowledgeDocumentEntry[]>;
  remove(projectId: string, documentId: string): Promise<void>;
}
