/**
 * API client for the DocumentIQ FastAPI backend.
 * All requests are authenticated with the X-API-Key header.
 */

const DEFAULT_API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export const VOICE_REPLIES_STORAGE_KEY = 'documentiq:voiceReplies';
export const PUSH_NOTIFICATIONS_STORAGE_KEY = 'documentiq:pushNotifications';

/** Resolves the backend base URL. */
export function getApiBase(): string {
  return DEFAULT_API_BASE;
}

const headers = () => ({
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
});

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Citation {
  document_name: string;
  page_number: number;
  page_image_path: string;
  document_id: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  sources_found: boolean;
}

export interface UploadResult {
  document_id: string;
  filename: string;
  status: string;
}

export interface ContentCharacteristics {
  has_tables: boolean;
  has_images: boolean;
  has_handwriting: boolean;
  is_scanned: boolean;
  is_multi_page: boolean;
  language: string;
}

export interface Classification {
  document_type: string;
  topic_domain: string;
  topic_summary: string;
  content_characteristics: ContentCharacteristics;
  sensitivity_level: string;
  sensitivity_reason: string;
  estimated_date: string | null;
  key_entities: string[];
}

export interface UploadStatus {
  document_id: string;
  filename: string;
  status: 'queued' | 'parsing' | 'classifying' | 'indexing' | 'ready' | 'error';
  classification: Classification | null;
  error_message: string | null;
  page_count: number;
}

export interface DocumentSummary {
  document_id: string;
  name: string;
  status: string;
  classification: Classification | null;
  page_count: number;
  upload_timestamp: string;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Upload one or more files to the bulk upload endpoint. */
export async function uploadDocuments(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(`${getApiBase()}/api/upload/bulk`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: formData,
  });
  return handle<UploadResult[]>(res);
}

/** Poll the processing status of a single uploaded document. */
export async function getUploadStatus(documentId: string): Promise<UploadStatus> {
  const res = await fetch(`${getApiBase()}/api/upload/status/${documentId}`, {
    headers: headers(),
  });
  return handle<UploadStatus>(res);
}

/** Fetch the full document library (for the bottom table on the upload page). */
export async function getAllDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch(`${getApiBase()}/api/upload/documents`, {
    headers: headers(),
  });
  return handle<DocumentSummary[]>(res);
}

/** Ask a question of the agentic RAG pipeline. */
export async function askQuestion(question: string, history: Message[]): Promise<ChatResponse> {
  const res = await fetch(`${getApiBase()}/api/chat/ask`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ question, conversation_history: history }),
  });
  return handle<ChatResponse>(res);
}

/**
 * URL for a rendered page image (used as <img> src). The API key is passed as
 * a query param because <img> tags cannot send custom headers — the endpoint
 * accepts the key via header OR query string.
 */
export function getPageImageUrl(documentId: string, pageNumber: number): string {
  return `${getApiBase()}/api/pages/${documentId}/${pageNumber}?api_key=${encodeURIComponent(API_KEY)}`;
}

export interface HealthStatus {
  status: string;
}

/** Checks whether the backend is reachable (used by the Settings system status panel). */
export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${getApiBase()}/health`);
  return handle<HealthStatus>(res);
}

export interface VoiceStatus {
  enabled: boolean;
}

/** Whether the backend has ElevenLabs configured. */
export async function getVoiceStatus(): Promise<VoiceStatus> {
  const res = await fetch(`${getApiBase()}/api/voice/status`, { headers: headers() });
  return handle<VoiceStatus>(res);
}

/** Synthesizes speech for `text` via ElevenLabs and returns playable audio bytes. */
export async function speakText(text: string): Promise<Blob> {
  const res = await fetch(`${getApiBase()}/api/voice/speak`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.blob();
}
