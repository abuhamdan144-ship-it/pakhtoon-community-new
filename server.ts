import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client on the server
// User-Agent: 'aistudio-build' is set for telemetry guidelines compliance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// JSON body parser with increased limit to handle base64 transmissions should they pass through the server
app.use(express.json({ limit: "50mb" }));

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Gemini Multi-turn Chat, Search Grounding, Thinking level API Route
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, model, systemInstruction, thinkingLevel, useSearch } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Build configuration
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    // Thinking Mode setup (using ThinkingLevel constraints from Gemini-3 SDK)
    if (thinkingLevel) {
      config.thinkingConfig = {
        thinkingLevel: thinkingLevel // e.g. "HIGH", "LOW"
      };
    }

    // Search Grounding setup
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents: messages,
      config,
    });

    // Extract search grounding metadata safely
    let searchChunks: any[] = [];
    try {
      const candidates = response.candidates;
      if (candidates && candidates[0] && candidates[0].groundingMetadata) {
        const metadata = candidates[0].groundingMetadata;
        searchChunks = metadata.groundingChunks || [];
      }
    } catch (e) {
      console.error("Error extracting search grounding metadata:", e);
    }

    res.json({
      text: response.text,
      metadata: {
        searchGroundingSources: searchChunks.map((chunk: any) => ({
          title: chunk.web?.title || "",
          url: chunk.web?.uri || ""
        })).filter(item => item.url)
      }
    });
  } catch (error: any) {
    console.error("Gemini API backend proxy helper error:", error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Vite middleware integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}).catch((err) => {
  console.error("Vite setup integration error:", err);
});
