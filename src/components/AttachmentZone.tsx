import React, { useState, useRef } from "react";
import { Attachment } from "../types";
import { Upload, X, FileText, Image, AlertCircle } from "lucide-react";

interface AttachmentZoneProps {
  attachments: Attachment[];
  onAddAttachment: (attachment: Attachment) => void;
  onRemoveAttachment: (id: string) => void;
}

export default function AttachmentZone({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: AttachmentZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    // Limit size to 5MB for preview stability
    if (file.size > 5 * 1024 * 1024) {
      setError(`File "${file.name}" is too large (max 5MB)`);
      return;
    }

    const reader = new FileReader();

    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        if (e.target?.result) {
          onAddAttachment({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type,
            size: file.size,
            content: e.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Treat as plain text / documents
      reader.onload = (e) => {
        if (e.target?.result) {
          onAddAttachment({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type || "text/plain",
            size: file.size,
            content: e.target.result as string,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file) processFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file) processFile(file);
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div id="attachment-uploader" className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50/70"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="text/*,image/*,.md,.json,.txt"
        />
        <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-700">Attach context files or imagery</p>
        <p className="text-xs text-slate-400 mt-1">Drag & drop or click to upload (.txt, .md, images up to 5MB)</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-rose-600 bg-rose-50 rounded-lg animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="group flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-white shadow-xs text-xs hover:border-slate-200"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {file.mimeType.startsWith("image/") ? (
                  <Image className="w-4 h-4 text-indigo-500 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <div className="truncate">
                  <p className="font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAttachment(file.id);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
