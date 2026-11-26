import React, { useState } from "react";
import { ProactiveSuggestion, SelectionRange } from "../types";
import {
  Sparkles,
  RefreshCw,
  Check,
  X,
  FileSearch,
  BookOpen,
  ArrowRight,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

interface AICompanionProps {
  content: string;
  selectedRange: SelectionRange | null;
  onApplyRevision: (revisedText: string, start: number, end: number) => void;
  onClearSelection: () => void;
  annotations: ProactiveSuggestion[];
  isAnalyzing: boolean;
  onTriggerAudit: () => Promise<void>;
  onFocusTextRange: (start: number, end: number) => void;
}

export default function AICompanion({
  content,
  selectedRange,
  onApplyRevision,
  onClearSelection,
  annotations,
  isAnalyzing,
  onTriggerAudit,
  onFocusTextRange,
}: AICompanionProps) {
  const [feedback, setFeedback] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active generation rewrite state
  const [activeRevision, setActiveRevision] = useState<{
    revisedText: string;
    explanation: string;
    start: number;
    end: number;
    originalText: string;
  } | null>(null);

  const QUICK_RECIPES = [
    { label: "⚡ Make Punchy", prompt: "Make this sentence short, high-impact, and punchy. Eliminate weak verbs." },
    { label: "🍃 Simplify Prose", prompt: "Simplify the language to make it highly readable, clear, and easy to understand without jargon." },
    { label: "📈 Expand Idea", prompt: "Expand on this point. Add a vivid, fitting sensory description or clear supporting clause." },
    { label: "🎭 Change Tone", prompt: "Shift the tone of this phrase to be more artistic, metaphorical, and premium." },
  ];

  const handleIterate = async (customPrompt?: string) => {
    if (!selectedRange) return;
    setIsIterating(true);
    setErrorMessage(null);
    const instruction = customPrompt || feedback;

    try {
      const response = await fetch("/api/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentContent: content,
          selectedText: selectedRange.text,
          start: selectedRange.start,
          end: selectedRange.end,
          feedback: instruction,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to revise selection");
      }

      const data = await response.json();
      setActiveRevision({
        revisedText: data.revisedText,
        explanation: data.explanation,
        start: selectedRange.start,
        end: selectedRange.end,
        originalText: selectedRange.text,
      });
      setFeedback("");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong making corrections.");
    } finally {
      setIsIterating(false);
    }
  };

  const applyRevisionUpdate = () => {
    if (!activeRevision) return;
    onApplyRevision(activeRevision.revisedText, activeRevision.start, activeRevision.end);
    setActiveRevision(null);
    onClearSelection();
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "clarity":
        return "bg-indigo-50 border-indigo-200 text-indigo-700";
      case "flow":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "tone":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "grammar":
        return "bg-rose-50 border-rose-200 text-rose-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-l border-slate-200 w-full min-w-[340px] max-w-[420px]">
      {/* Companion Header */}
      <div className="p-4 border-b border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">AI Writing Partner</h3>
            <p className="text-[11px] text-slate-400">Collaboration Engine • Gemini 3.5 Active</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* State A: Under Active Character Selection Editing */}
        {selectedRange ? (
          <div id="selection-editing-panel" className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                ✨ Selected Segment
              </span>
              <button
                onClick={onClearSelection}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear selection
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs italic text-slate-600 prose line-clamp-4 leading-relaxed">
              "{selectedRange.text}"
            </div>

            {!activeRevision ? (
              // Selecting feedback and submitting
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Quick Recipes</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_RECIPES.map((recipe) => (
                      <button
                        key={recipe.label}
                        disabled={isIterating}
                        onClick={() => handleIterate(recipe.prompt)}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-medium border border-slate-200 hover:border-indigo-200 rounded-lg transition-all text-left truncate disabled:opacity-50"
                      >
                        {recipe.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="custom-feedback-input" className="text-xs font-semibold text-slate-700">Custom Inline Feedback</label>
                  <div className="relative">
                    <textarea
                      id="custom-feedback-input"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g., 'rewrite this paragraph with a dramatic metaphor' or 'make it sound more academic'"
                      rows={3}
                      className="w-full text-xs p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg outline-none transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleIterate()}
                    disabled={isIterating || !feedback.trim()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    {isIterating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Weaving edits...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Refine Selection
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Live comparison preview comparing before & after
              <div className="space-y-4 border-t border-slate-100 pt-4 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-800">Proposed In-Place Rewrite</h4>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-rose-500 uppercase">Original</div>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs line-through text-rose-700">
                    {activeRevision.originalText}
                  </div>

                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Suggested Rewrite</div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-medium text-emerald-800 leading-relaxed">
                    {activeRevision.revisedText}
                  </div>
                </div>

                {activeRevision.explanation && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-lg text-xs text-slate-600">
                    <p className="font-semibold text-indigo-900 text-[11px] mb-1">💡 Companion Thought:</p>
                    {activeRevision.explanation}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={applyRevisionUpdate}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Check className="w-4 h-4" /> Accept & Splice
                  </button>
                  <button
                    onClick={() => setActiveRevision(null)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-rose-500 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                ⚠️ {errorMessage}
              </p>
            )}
          </div>
        ) : (
          /* State B: Document Audit Proposals */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                Proactive Feedback
              </h4>
              <button
                onClick={onTriggerAudit}
                disabled={isAnalyzing || content.length < 20}
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 font-medium cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Analyzing..." : "Audit Document"}
              </button>
            </div>

            {isAnalyzing ? (
              <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
                  <FileSearch className="w-5 h-5 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-800">Reading Draft over your shoulder...</p>
                  <p className="text-[10px] text-slate-400">Looking for style level-ups and flow adjustments</p>
                </div>
                <div className="w-24 h-1 bg-slate-100 mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-1/2 rounded-full animate-pulse-glow" style={{ width: "70%" }}></div>
                </div>
              </div>
            ) : annotations.length > 0 ? (
              <div className="space-y-3">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    id={`annotation-card-${ann.id}`}
                    onClick={() => {
                      // Highlight matching text occurrence in document
                      const startIdx = content.indexOf(ann.targetText);
                      if (startIdx !== -1) {
                        onFocusTextRange(startIdx, startIdx + ann.targetText.length);
                      }
                    }}
                    className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryColor(ann.category)}`}>
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                        Focus Spot <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800 pr-1">Target:</span>
                      <span className="italic line-through text-rose-600">"{ann.targetText}"</span>
                    </div>

                    <div className="text-[11px] text-slate-800 font-medium">
                      <span className="font-semibold pr-1">Try instead:</span>
                      <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">"{ann.suggestion}"</span>
                    </div>

                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                      {ann.explanation}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const startIdx = content.indexOf(ann.targetText);
                        if (startIdx !== -1) {
                          onApplyRevision(ann.suggestion, startIdx, startIdx + ann.targetText.length);
                        }
                      }}
                      className="w-full py-1.5 mt-1 border border-indigo-200 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Fix
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-2.5">
                <BookOpen className="w-7 h-7 mx-auto text-slate-300" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Audit Desk Is Silent</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                    {content.trim().length < 20
                      ? "Write a few sentences or generate a draft, then click 'Audit Document' to invoke review comments."
                      : "Click 'Audit Document' above for structural reviews on clarity, voice, and stylistic punch!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200 text-center">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <TrendingUp className="w-3 h-3 text-indigo-400" />
          Pro Tip: Selected segments instantly bring up revision tools.
        </span>
      </div>
    </div>
  );
}
