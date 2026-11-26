/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import { Attachment, SelectionRange, ProactiveSuggestion } from "./types";
import { WRITING_TEMPLATES, Template } from "./components/TemplateCatalog";
import AttachmentZone from "./components/AttachmentZone";
import WritingStage from "./components/WritingStage";
import AICompanion from "./components/AICompanion";
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  Trash2,
  ListRestart,
  Wand2,
  FileCheck2,
  HelpCircle,
} from "lucide-react";

export default function App() {
  // Document State
  const [title, setTitle] = useState("Quantum Landscapes & The Cosmic Loom");
  const [content, setContent] = useState(WRITING_TEMPLATES[0].content);

  // Left Sidebar Panel Tabs (Library vs Create Draft)
  const [activeTab, setActiveTab] = useState<"library" | "draft">("library");

  // Draft generation prompt & uploaded files
  const [initialPrompt, setInitialPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Focus & active selection ranges
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(null);
  const [annotations, setAnnotations] = useState<ProactiveSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Textarea reference trigger
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Handle focused character highlight range
  const handleFocusTextRange = useCallback((start: number, end: number) => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(start, end);
      // Retrieve text excerpt for the active selection
      const text = el.value.substring(start, end);
      setSelectedRange({ text, start, end });
    }
  }, []);

  // Set textarea reference
  const handleTriggerAnnotationFocus = useCallback((el: HTMLTextAreaElement) => {
    textareaRef.current = el;
  }, []);

  // Splicing revised text into the original text string
  const handleApplyRevision = (revisedText: string, start: number, end: number) => {
    const partBefore = content.substring(0, start);
    const partAfter = content.substring(end);
    const updatedContent = partBefore + revisedText + partAfter;

    setContent(updatedContent);
    setSelectedRange(null);

    // After updating, clear comments to avoid index layout drifted targets, then re-scan
    setAnnotations([]);
  };

  // Run proactive structural review
  const triggerProactiveAudit = async () => {
    if (!content || content.trim().length < 20) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/proactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentContent: content }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile writing annotations");
      }

      const data = await response.json();
      setAnnotations(data.suggestions || []);
    } catch (err) {
      console.error("Error analyzing text proactively:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate initial draft using AI based on prompts & context attachments
  const handleGenerateInitialDraft = async () => {
    if (!initialPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: initialPrompt,
          attachments: attachments,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate initial draft");
      }

      const data = await response.json();
      setTitle(data.title || "AI Generated Draft");
      setContent(data.content || "");
      setSelectedRange(null);
      setAnnotations([]);
      setInitialPrompt("");
    } catch (err) {
      console.error(err);
      alert("Error generating content draft. Please verify Gemini configurations in the secrets panel.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadTemplate = (tpl: Template) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    setSelectedRange(null);
    setAnnotations([]);
  };

  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear your current text and start a blank parchment?")) {
      setTitle("Untitled Draft");
      setContent("");
      setSelectedRange(null);
      setAnnotations([]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Top Studio Header */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-serif font-bold text-lg select-none shadow-xs">
            W
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">AI Writing Studio</h1>
            <p className="text-[10px] text-slate-500 font-medium">Interactive Prose Workshop</p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={triggerProactiveAudit}
            disabled={isAnalyzing || content.length < 20}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-indigo-100/50 cursor-pointer transition-colors"
          >
            <FileCheck2 className="w-4 h-4" />
            {isAnalyzing ? "Auditing prose..." : "Audit Writing"}
          </button>

          <button
            onClick={handleClearCanvas}
            className="p-1 px-2.5 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            title="Start fresh"
          >
            <Trash2 className="w-3.5 h-3.5" /> Start Blank
          </button>
        </div>
      </header>

      {/* Workspace Tri-Panel Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Left Workbench Controls */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-xs">
          {/* Tab Selector Buttons */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("library")}
              className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === "library"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/10"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Starter Library
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === "draft"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/10"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> AI Draft Machine
            </button>
          </div>

          {/* Tab Content Areas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activeTab === "library" ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Quick Sample Drafts
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Select a sample text below to test inline editing, feedback cycles, and proactive suggestions.
                  </p>
                </div>

                <div className="space-y-3">
                  {WRITING_TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => handleLoadTemplate(tpl)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                        title === tpl.title
                          ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600/30"
                          : "border-slate-150 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        {tpl.category}
                      </span>
                      <h3 className="font-semibold text-xs text-slate-800 mt-1.5 truncate">
                        {tpl.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-normal">
                        {tpl.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4" id="ai-generator-tab">
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Compose with AI Context
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Describe what you want to write, attach spreadsheets, guidelines, or layout ideas, and generate a customized starting draft.
                  </p>
                </div>

                {/* Initial Prompts Trigger */}
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label htmlFor="ai-prompt-editor" className="text-xs font-semibold text-slate-700">Writing Prompt</label>
                    <textarea
                      id="ai-prompt-editor"
                      value={initialPrompt}
                      onChange={(e) => setInitialPrompt(e.target.value)}
                      placeholder="e.g., 'Draft a structured LinkedIn narrative centered around lessons from early product failure, incorporating a poetic and modern storytelling style...'"
                      rows={4}
                      className="w-full text-xs p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 rounded-lg outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Drag-and-drop boundary context */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Reference Materials</label>
                    <AttachmentZone
                      attachments={attachments}
                      onAddAttachment={(newAtt) => setAttachments((prev) => [...prev, newAtt])}
                      onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                    />
                  </div>

                  <button
                    onClick={handleGenerateInitialDraft}
                    disabled={isGenerating || !initialPrompt.trim()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="w-4 h-4 animate-spin" />
                        Weaving Draft...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Initial Draft
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Block */}
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-slate-400 text-[10px] space-y-1.5">
            <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px]">Draft Partner Instructions</p>
            <p className="leading-relaxed">Highlight any sentence or text segment in the editor to spark inline revisions with custom suggestions.</p>
          </div>
        </div>

        {/* Panel 2: Center Editor Stage */}
        <WritingStage
          title={title}
          onTitleChange={setTitle}
          content={content}
          onContentChange={setContent}
          selectedRange={selectedRange}
          onSelectionUpdate={setSelectedRange}
          onTriggerAnnotationFocus={handleTriggerAnnotationFocus}
        />

        {/* Panel 3: Right Side partner companion */}
        <AICompanion
          content={content}
          selectedRange={selectedRange}
          onApplyRevision={handleApplyRevision}
          onClearSelection={() => setSelectedRange(null)}
          annotations={annotations}
          isAnalyzing={isAnalyzing}
          onTriggerAudit={triggerProactiveAudit}
          onFocusTextRange={handleFocusTextRange}
        />
      </div>
    </div>
  );
}
