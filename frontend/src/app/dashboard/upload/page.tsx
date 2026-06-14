'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, X, AlertCircle, RefreshCw } from 'lucide-react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import {
  uploadDocuments,
  getUploadStatus,
  getAllDocuments,
  type DocumentSummary,
  type UploadStatus,
} from '@/lib/api';

type TrackedDoc = UploadStatus;

const PIPELINE_STEPS: { key: UploadStatus['status']; label: string }[] = [
  { key: 'queued', label: 'Queued' },
  { key: 'parsing', label: 'Parsing' },
  { key: 'classifying', label: 'Classifying' },
  { key: 'indexing', label: 'Indexing' },
  { key: 'ready', label: 'Ready' },
];

const SENSITIVITY_MAP: Record<string, { variant: any; label: string }> = {
  public: { variant: 'success', label: 'Public' },
  internal: { variant: 'warning', label: 'Internal' },
  confidential: { variant: 'orange', label: 'Confidential' },
  highly_confidential: { variant: 'error', label: 'Highly Confidential' },
};

const STATUS_MAP: Record<string, { variant: any; label: string }> = {
  queued: { variant: 'default', label: 'Queued' },
  parsing: { variant: 'info', label: 'Parsing' },
  classifying: { variant: 'info', label: 'Classifying' },
  indexing: { variant: 'info', label: 'Indexing' },
  ready: { variant: 'success', label: 'Ready' },
  error: { variant: 'error', label: 'Error' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatType(type: string | undefined): string {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function SensitivityBadge({ level }: { level?: string }) {
  const cfg = SENSITIVITY_MAP[level || 'internal'] || SENSITIVITY_MAP.internal;
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.queued;
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}

function PipelineTracker({ status }: { status: UploadStatus['status'] }) {
  const order = PIPELINE_STEPS.map((s) => s.key);
  const currentIndex = order.indexOf(status);

  return (
    <div className="flex items-center">
      {PIPELINE_STEPS.map((step, i) => {
        const isError = status === 'error';
        const done = !isError && (i < currentIndex || (i === currentIndex && status === 'ready'));
        const active = !isError && i === currentIndex && status !== 'ready';

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  done
                    ? 'bg-[#16A34A]'
                    : active
                    ? 'bg-[#2563EB] animate-pulse shadow-[0_0_0_4px_rgba(37,99,235,0.15)]'
                    : 'bg-[#E4E4E7]'
                }`}
              />
              <span
                className={`text-[10px] whitespace-nowrap ${
                  done || active ? 'text-[#09090B] font-medium' : 'text-[#A1A1AA]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div
                className={`h-px w-8 sm:w-12 mx-1.5 mb-4 ${
                  i < currentIndex && !isError ? 'bg-[#16A34A]' : 'bg-[#E4E4E7]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function UploadPage() {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [trackedDocs, setTrackedDocs] = useState<TrackedDoc[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const docs = await getAllDocuments();
      setDocuments(docs);
    } catch {
      // ignore — library will just stay stale until next refresh
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll status for any in-flight uploads every 2s.
  useEffect(() => {
    const active = trackedDocs.filter((d) => d.status !== 'ready' && d.status !== 'error');
    if (active.length === 0) return;

    const interval = setInterval(async () => {
      const updates = await Promise.all(
        active.map(async (d) => {
          try {
            return await getUploadStatus(d.document_id);
          } catch {
            return null;
          }
        })
      );

      setTrackedDocs((prev) =>
        prev.map((d) => {
          const update = updates.find((u) => u && u.document_id === d.document_id);
          return update ? update : d;
        })
      );

      if (updates.some((u) => u && (u.status === 'ready' || u.status === 'error'))) {
        fetchDocuments();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [trackedDocs, fetchDocuments]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPendingFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (pendingFiles.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const results = await uploadDocuments(pendingFiles);
      const newTracked: TrackedDoc[] = results.map((r) => ({
        document_id: r.document_id,
        filename: r.filename,
        status: r.status as UploadStatus['status'],
        classification: null,
        error_message: null,
        page_count: 0,
      }));
      setTrackedDocs((prev) => [...newTracked, ...prev]);
      setPendingFiles([]);
      fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-8 py-6 space-y-10 max-w-6xl">
      {/* Upload zone */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-lg font-semibold text-[#09090B] mb-1">Upload Documents</h2>
        <p className="text-sm text-[#71717A] mb-4">
          Add PDFs, Word documents, or plain text files. Each one is parsed, classified, and
          indexed automatically.
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-black bg-[#F4F4F5]' : 'border-[#E4E4E7] hover:border-[#A1A1AA]'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud size={32} className="mx-auto text-[#71717A] mb-3" />
          <p className="text-sm font-medium text-[#09090B]">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-xs text-[#71717A] mt-1">
            Supports .pdf, .docx, and .txt — up to 50MB per file
          </p>
        </div>

        {pendingFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {pendingFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between border border-[#E4E4E7] rounded px-3 py-2 bg-white"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="text-[#71717A] shrink-0" />
                  <span className="text-sm text-[#09090B] truncate">{file.name}</span>
                  <span className="text-xs text-[#A1A1AA] shrink-0">{formatBytes(file.size)}</span>
                </div>
                <button
                  onClick={() => removePendingFile(i)}
                  className="p-1 hover:bg-[#F4F4F5] rounded transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Uploading...' : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </motion.section>

      {/* Per-file processing status */}
      {trackedDocs.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-lg font-semibold text-[#09090B] mb-4">Processing Status</h2>
          <div className="space-y-3">
            {trackedDocs.map((doc, i) => (
              <motion.div
                key={doc.document_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`border rounded-lg p-4 bg-white transition-colors ${
                  doc.status === 'error' ? 'border-[#DC2626]/30' : 'border-[#E4E4E7]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-[#71717A] shrink-0" />
                    <span className="text-sm font-medium text-[#09090B] truncate">{doc.filename}</span>
                  </div>
                  <PipelineTracker status={doc.status} />
                </div>

                {doc.status === 'ready' && doc.classification && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-[#E4E4E7]">
                    <Badge size="sm">{formatType(doc.classification.document_type)}</Badge>
                    <span className="text-xs text-[#71717A]">{doc.classification.topic_domain}</span>
                    <SensitivityBadge level={doc.classification.sensitivity_level} />
                    {doc.classification.content_characteristics.has_tables && (
                      <Badge variant="info" size="sm">Tables</Badge>
                    )}
                    {doc.classification.content_characteristics.is_scanned && (
                      <Badge variant="info" size="sm">Scanned</Badge>
                    )}
                    <span className="text-xs text-[#A1A1AA]">{doc.page_count} page{doc.page_count === 1 ? '' : 's'}</span>
                  </div>
                )}

                {doc.status === 'error' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#DC2626] bg-[#FEF2F2] rounded px-2.5 py-2 pt-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {doc.error_message || 'Processing failed.'}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Document library */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#09090B]">Document Library</h2>
            <p className="text-sm text-[#71717A]">All documents available to the chatbot.</p>
          </div>
          <button
            onClick={fetchDocuments}
            className="flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#09090B] transition-colors px-3 py-1.5 border border-[#E4E4E7] rounded"
          >
            <RefreshCw size={14} className={loadingLibrary ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto border border-[#E4E4E7] rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7]">
              <tr>
                <th className="text-left font-medium text-[#71717A] px-4 py-3">Name</th>
                <th className="text-left font-medium text-[#71717A] px-4 py-3">Type</th>
                <th className="text-left font-medium text-[#71717A] px-4 py-3">Topic</th>
                <th className="text-left font-medium text-[#71717A] px-4 py-3">Sensitivity</th>
                <th className="text-left font-medium text-[#71717A] px-4 py-3">Pages</th>
                <th className="text-left font-medium text-[#71717A] px-4 py-3">Status</th>
                <th className="text-left font-medium text-[#71717A] px-4 py-3">Uploaded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#A1A1AA]">
                    No documents yet. Upload one above to get started.
                  </td>
                </tr>
              ) : (
                documents.map((doc, i) => (
                  <motion.tr
                    key={doc.document_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                    className="hover:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3 font-medium text-[#09090B]">{doc.name}</td>
                    <td className="px-4 py-3 text-[#71717A]">{formatType(doc.classification?.document_type)}</td>
                    <td className="px-4 py-3 text-[#71717A]">{doc.classification?.topic_domain || '—'}</td>
                    <td className="px-4 py-3">
                      <SensitivityBadge level={doc.classification?.sensitivity_level} />
                    </td>
                    <td className="px-4 py-3 text-[#71717A]">{doc.page_count}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 text-[#71717A]">{formatDate(doc.upload_timestamp)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
