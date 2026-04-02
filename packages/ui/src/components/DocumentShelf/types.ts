export interface DocumentInfo {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedAt: string;
  mimeType?: string;
}

export interface AutoIndexSummaryData {
  findings: number;
  answers: number;
  conclusions: number;
}
