import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with generous limit for attachments
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. Features running Gemini will fail until it is configured.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ========================
// API Endpoints
// ========================

// Endpoint 1: Generate initial writing based on prompt + attachments
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, attachments } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Build the parts for the content generation
    const parts: any[] = [];

    // Process attachments
    let attachmentNotes = "";
    if (attachments && Array.isArray(attachments)) {
      attachments.forEach((att) => {
        if (att.mimeType && att.mimeType.startsWith("image/") && att.content) {
          // Extract plain base64 data from potential data URL
          const base64Data = att.content.includes("base64,")
            ? att.content.split("base64,")[1]
            : att.content;

          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64Data,
            },
          });
        } else if (att.content) {
          // Merge text attachments directly into training notes
          attachmentNotes += `\n\n--- Start of attached reference file: "${att.name}" ---\n${att.content}\n--- End of reference file ---\n`;
        }
      });
    }

    const instructionPrompt = `You are an elite, highly creative writing assistant and prose editor.
Your goal is to compose an initial draft matching the user's prompt. 
Be creative, engaging, and exceptionally polished.

User Prompt:
${prompt}
${attachmentNotes ? `\nReference Attachments:\n${attachmentNotes}` : ""}

Please generate an engaging piece, structured logically with appropriate headings if needed.
Provide your response strictly in the requested JSON format containing:
1. title: A fitting, creative title for the draft
2. content: The full drafted text or article
3. comments: Brief professional notes on the writing style and structure you chose.`;

    parts.push({ text: instructionPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The main title for the draft",
            },
            content: {
              type: Type.STRING,
              description: "The core drafted article/post text with markdown spacing (paragraphs separated by double newlines)",
            },
            comments: {
              type: Type.STRING,
              description: "Short metadata or commentary explaining your stylistic strategy",
            },
          },
          required: ["title", "content", "comments"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini API");
    }

    const result = JSON.parse(response.text.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/generate:", error);
    return res.status(500).json({ error: error.message || "Failed to generate story draft" });
  }
});

// Endpoint 2: Iterate and rewrite a selected section based on inline feedback
app.post("/api/iterate", async (req, res) => {
  try {
    const { documentContent, selectedText, start, end, feedback } = req.body;

    if (!documentContent) {
      return res.status(400).json({ error: "Document content is required" });
    }
    if (!selectedText) {
      return res.status(400).json({ error: "Selected text portion is required to perform inline iteration" });
    }
    if (!feedback) {
      return res.status(400).json({ error: "Feedback instructions are required" });
    }

    // Capture surrounding context for tone blending and transition consistency
    const contextBefore = documentContent.substring(Math.max(0, start - 300), start);
    const contextAfter = documentContent.substring(end, Math.min(documentContent.length, end + 300));

    const promptText = `You are a brilliant prose editor editing an article.
You are given a document, but your task is specifically to rewrite a TARGET SELECTION of text inside that document based on user FEEDBACK.
It is ESSENTIAL that your revised version blends and weaves SEAMLESSLY back into the surrounding text context (the parts immediately before and after it). Maintain perfect grammatical transitions, stylistic harmony, and overall pacing.

Full Document Content:
"""
${documentContent}
"""

Target Selection to Rewrite:
"""
${selectedText}
"""

Surrounding Context (strictly for reference and flow):
- Immediately Before target: "...${contextBefore}"
- Immediately After target: "${contextAfter}..."

User Feedback / Change Instruction:
"${feedback}"

Task:
Generate a heavily polished and revised version of the EXACT selected selection, listening carefully to the user's feedback. Do NOT rewrite the whole document, ONLY return the revised replacement segment of the target text.
Provide the response strictly in JSON format containing:
1. revisedText: The replacement text for the selected selection.
2. explanation: A concise, human-to-human note explaining how you wove the feedback and changes in harmoniously with the rest of the text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            revisedText: {
              type: Type.STRING,
              description: "The newly polished rewrite that will replace the highlighted segment.",
            },
            explanation: {
              type: Type.STRING,
              description: "A short, professional summary of the edits and details on how it flows with adjacent paragraphs.",
            },
          },
          required: ["revisedText", "explanation"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini API during iteration");
    }

    const result = JSON.parse(response.text.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/iterate:", error);
    return res.status(500).json({ error: error.message || "Failed to edit inline fragment" });
  }
});

// Endpoint 3: Proactive suggestions
app.post("/api/proactive", async (req, res) => {
  try {
    const { documentContent } = req.body;
    if (!documentContent || documentContent.trim().length < 20) {
      return res.json({ suggestions: [] });
    }

    const promptText = `You are an attentive and encouraging writing mentor.
Read this draft "over the shoulder" of the author. Identify 1 to 3 key spots where the writing could be significantly leveled up.
Focus on:
- Passive voice vs active voice
- Clunky flow or transitions
- Repetitive words or dry phrasing
- Explanatory gaps where a vivid detail or analogy could be helpful

Document Content:
"""
${documentContent}
"""

Task:
Analyze the document and provide 1 to 3 distinct proactive suggestions. For each suggestion:
- Find the EXACT substring inside the document that should be commented on (the 'targetText'). This must match exactly in the document.
- Propose a 'suggestion': a beautiful, rewritten alternative for that segment.
- Write an 'explanation' explaining why your rewrite works better.
- Choose a category: 'clarity' | 'flow' | 'tone' | 'grammar' | 'style'.

Provide your response strictly in the JSON format detailed. If the document is flawless or too short to critique, return empty arrays.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetText: {
                    type: Type.STRING,
                    description: "The EXACT text portion from the document to suggest replacing.",
                  },
                  suggestion: {
                    type: Type.STRING,
                    description: "The proposed replacement text.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A short, friendly, and helpful explanation of why this change improves the writing.",
                  },
                  category: {
                    type: Type.STRING,
                    description: "Representing classification: clarity, flow, tone, grammar, style",
                  },
                },
                required: ["targetText", "suggestion", "explanation", "category"],
              },
            },
          },
          required: ["suggestions"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini API during proactive check");
    }

    const result = JSON.parse(response.text.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/proactive:", error);
    return res.status(500).json({ error: error.message || "Failed to compile proactive feedback" });
  }
});

// ========================
// Server Setup & Static Assets
// ========================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // In dev, use the Vite dev server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    // In production, serve the compiled build assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from production dist: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Writing Studio server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start AI Writing Studio server:", err);
});
