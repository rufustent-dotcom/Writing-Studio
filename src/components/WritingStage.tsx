import React, { useRef, useEffect } from "react";
import { SelectionRange } from "../types";
import { Sparkles, AlignLeft, Underline } from "lucide-react";

interface WritingStageProps {
  title: string;
  onTitleChange: (title: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  selectedRange: SelectionRange | null;
  onSelectionUpdate: (range: SelectionRange | null) => void;
  onTriggerAnnotationFocus: (textarea: HTMLTextAreaElement) => void;
}

export default function WritingStage({
  title,
  onTitleChange,
  content,
  onContentChange,
  selectedRange,
  onSelectionUpdate,
  onTriggerAnnotationFocus,
}: WritingStageProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus utility passed back to App
  useEffect(() => {
    if (textareaRef.current) {
      onTriggerAnnotationFocus(textareaRef.current);
    }
  }, [onTriggerAnnotationFocus]);

  // Track natural selection changes in word editor
  const handleTextareaSelection = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start !== end) {
      const selectedText = el.value.substring(start, end);
      if (selectedText.trim().length > 1) {
        onSelectionUpdate({
          text: selectedText,
          start,
          end,
        });
        return;
      }
    }
    // Only clear if we explicitly are not clicking surrounding actions
    // Let App handle selection clearing or persistence
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Selection Notification Bar */}
      {selectedRange && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-indigo-900 border border-indigo-700/50 shadow-lg text-white px-4 py-2 rounded-full flex items-center gap-3 animate-fade-in text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Selection Highlighted ({selectedRange.text.trim().length} chars)
          </span>
          <span className="w-px h-3 bg-indigo-70010" />
          <span className="text-indigo-200 truncate max-w-[150px] italic">
            "{selectedRange.text}"
          </span>
          <span className="text-slate-200">← Edit selection in right panel</span>
        </div>
      )}

      {/* Editor Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-10 md:px-12 lg:px-16 max-w-4xl mx-auto w-full flex flex-col space-y-5">
        {/* Document Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Document..."
          id="editor-title-input"
          className="w-full text-3xl font-bold font-serif text-slate-900 placeholder-slate-200 border-none outline-none focus:ring-0 leading-tight pb-2"
        />

        <div className="flex items-center gap-4 text-xs text-slate-400 border-b border-rose-100/30 pb-4">
          <span className="flex items-center gap-1">
            <AlignLeft className="w-3.5 h-3.5" /> {wordCount} words
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Underline className="w-3.5 h-3.5" /> {charCount} characters
          </span>
        </div>

        {/* Serif Draft Board */}
        <div className="flex-1 relative flex flex-col">
          <textarea
            ref={textareaRef}
            id="editor-body-textarea"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onMouseUp={handleTextareaSelection}
            onKeyUp={handleTextareaSelection}
            onSelect={handleTextareaSelection}
            placeholder="Write your story masterpiece freely here, or load a pre-arranged draft on the left. Highlight any sentence or paragraph to have your AI Partner refine and weave changes in-place instantly..."
            className="flex-1 w-full text-slate-800 placeholder-slate-300 border-none focus:outline-none focus:ring-0 text-[17px] font-serif leading-8 resize-none p-0 bg-transparent min-h-[400px]"
          />
        </div>
      </div>
    </div>
  );
}
