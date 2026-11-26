/**
 * Types for the AI Writing Studio
 */

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  content: string; // Base64 or plain text content
}

export interface Document {
  id: string;
  title: string;
  content: string;
  lastSaved: number;
}

export interface SelectionRange {
  text: string;
  start: number;
  end: number;
}

export interface Revision {
  id: string;
  timestamp: number;
  originalText: string;
  revisedText: string;
  explanation: string;
  start: number;
  end: number;
}

export interface ProactiveSuggestion {
  id: string;
  targetText: string;
  suggestion: string;
  explanation: string;
  category: 'clarity' | 'flow' | 'tone' | 'grammar' | 'style';
  start: number;
  end: number;
}

export interface GenerationRequest {
  prompt: string;
  attachments: Attachment[];
}

export interface IterationRequest {
  documentContent: string;
  selectedText: string;
  start: number;
  end: number;
  feedback: string;
}

export interface ProactiveRequest {
  documentContent: string;
}
