import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import * as nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

// Load Firebase configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.error("Failed to parse firebase-applet-config.json:", err);
  }
}

// Initialize Firebase Client SDK dynamically matching target project and custom database ID
let db: any = null;
let auth: any = null;
if (firebaseConfig.projectId) {
  try {
    const appInstance = initializeApp(firebaseConfig);
    db = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId || "(default)");
    auth = getAuth(appInstance);
    console.log(`Firebase Client SDK initialized for database: ${firebaseConfig.firestoreDatabaseId || "(default)"}`);
  } catch (err) {
    console.error("Failed to initialize Firebase Client SDK in server.ts:", err);
  }
}



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

/**
 * Nodemailer local email dispatcher helper
 */
async function sendApprovalEmailLocally(member: any, memberId: string) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const email = member.email;
  const name = member.name || "Member";
  const membershipId = member.membershipId || "N/A";
  const father = member.father || "-";
  const cnic = member.cnic || "-";
  const district = member.district || "-";

  if (!user || !pass) {
    console.log(`[SMTP SIMULATION] Simulated approval email dispatched to ${email}`);
    console.log(`[SMTP SIMULATION] Params: Name = ${name}, Membership ID = ${membershipId}`);
    try {
      await setDoc(doc(db, "members", memberId), {
        emailSent: true,
        emailSentAt: serverTimestamp()
      }, { merge: true });
      console.log(`[SMTP SIMULATION] Marked member doc ${memberId} as email-notified in Firestore.`);
    } catch (err) {
      console.error("Failed to write emailSent status to Firestore under simulation:", err);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>OPC Lifetime Membership Approved</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f7f9fa;
          color: #333333;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid #e1e8ed;
        }
        .header {
          background-color: #064e3b; /* Deep Emerald */
          background-image: linear-gradient(135deg, #064e3b 0%, #14532d 100%);
          color: #fcd34d; /* Amber Accent */
          text-align: center;
          padding: 35px 20px;
          position: relative;
        }
        .header h1 {
          margin: 0 0 5px 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .header p {
          margin: 0;
          font-size: 13px;
          color: #e2e8f0;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .content {
          padding: 30px 25px;
          line-height: 1.6;
        }
        .content h2 {
          color: #064e3b;
          font-size: 18px;
          margin-top: 0;
          border-left: 4px solid #f59e0b;
          padding-left: 10px;
        }
        .card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .card-title {
          font-weight: bold;
          color: #0f172a;
          font-size: 15px;
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .detail-label {
          color: #64748b;
          font-weight: 500;
        }
        .detail-value {
          color: #0f172a;
          font-weight: 600;
        }
        .btn {
          display: inline-block;
          background-color: #f59e0b; /* Amber */
          color: #064e3b !important;
          font-weight: bold;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 6px;
          text-align: center;
          font-size: 14px;
          margin: 15px 0;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.15);
        }
        .btn:hover {
          background-color: #d97706;
        }
        .footer {
          background-color: #042f2e;
          color: #cbd5e1;
          padding: 25px;
          font-size: 11px;
          text-align: center;
          border-top: 1px solid #115e59;
        }
        .footer p {
          margin: 5px 0;
        }
        .footer a {
          color: #f59e0b;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Oman Pakhtoon Community</h1>
          <p>DIASPORA ASSOCIATION CERTIFICATION</p>
        </div>
        <div class="content">
          <h2>Lifetime Membership Approved</h2>
          <p>Assalam-o-Alaikum <strong>${name}</strong>,</p>
          <p>We are pleased to inform you that your registration request with the **Oman Pakhtoon Community (OPC)** has been officially approved by the Executive Council Board.</p>
          <p>Your lifetime digital association credentials have been compiled and issued. You can now access, preview, and download your customized identity card, formal association certificate, and official registration receipt on our digital portal.</p>
          
          <div class="card">
            <div class="card-title">OFFICIAL REGISTRATION PARTICULARS</div>
            <div class="detail-row">
              <span class="detail-label">Membership ID:</span>
              <span class="detail-value" style="color:#059669; font-family: monospace;">${membershipId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Father's Name:</span>
              <span class="detail-value">${father}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">CNIC / Passport:</span>
              <span class="detail-value" style="font-family: monospace;">${cnic}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">District / Tribe:</span>
              <span class="detail-value">${district}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Association Type:</span>
              <span class="detail-value">Lifetime Member</span>
            </div>
          </div>

          <p style="text-align: center;">
            <a href="https://ais-pre-cowktklz2drg7vmc4ceet3-469166214171.europe-west1.run.app" class="btn">Access OPC Digital Portal</a>
          </p>

          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            *If you did not submit this application, please ignore this email or contact our support team.
          </p>
        </div>
        <div class="footer">
          <p><strong>Oman Pakhtoon Community (OPC)</strong></p>
          <p>Muscat, Sultanate of Oman | Website: <a href="https://ais-pre-cowktklz2drg7vmc4ceet3-469166214171.europe-west1.run.app">opc-oman.org</a></p>
          <p>Consular Emergency Hotline &gt; WhatsApp +968 99111870</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const fromAddress = process.env.SMTP_SENDER_EMAIL || user;
    await transporter.sendMail({
      from: `"Oman Pakhtoon Community" <${fromAddress}>`,
      to: email,
      subject: `🟢 OPC Lifetime Membership Officially Approved - ID: ${membershipId}`,
      text: `Assalam-o-Alaikum ${name},\n\nYour association application with the Oman Pakhtoon Community has been approved.\nIssued Membership ID: ${membershipId}\nFather's Name: ${father}\nCNIC/Passport: ${cnic}\n\nPlease visit the OPC portal to generate and download your identity cards.\n\nBest regards,\nOPC Executive Council Board`,
      html: htmlContent
    });

    console.log(`[SMTP SUCCESS] Approval email successfully dispatched to ${email}`);

    // Update member record with emailSent tag in Firestore database
    await setDoc(doc(db, "members", memberId), {
      emailSent: true,
      emailSentAt: serverTimestamp()
    }, { merge: true });

    console.log(`[SMTP SUCCESS] Marked member doc ${memberId} as email-notified in Firestore.`);
  } catch (err: any) {
    console.warn(`[SMTP WARNING] Outbound SMTP dispatch deferred for ${email}:`, err.message || err);
    console.log(`[SMTP FALLBACK] Executing self-healing fallback for ${email} (${memberId}) to prevent loop...`);
    try {
      await setDoc(doc(db, "members", memberId), {
        emailSent: true,
        emailSentAt: serverTimestamp(),
        emailStatus: "failed_smtp_fallback",
        emailError: err.message || String(err)
      }, { merge: true });
      console.log(`[SMTP FALLBACK] Marked member doc ${memberId} as emailSent:true to successfully heal trigger loop.`);
    } catch (dbErr: any) {
      console.warn("Failed to update Firestore status following SMTP failure:", dbErr.message || dbErr);
    }
  }
}

/**
 * Polling checker for member status updates to prevent active listen stream connection cancellations & SMTP congestion.
 * Simulates Cloud Function triggers safely by periodically checking the database and sequencing email deliveries.
 */
function initFirestorePollingTrigger() {
  if (!db || !auth) {
    console.warn("Firestore db or auth client is not initialized in server.ts. Background polling triggers are disabled.");
    return;
  }

  console.log("Authenticating background server polling process as OPC Admin ('admin@opc.com')...");
  signInWithEmailAndPassword(auth, "admin@opc.com", "admin123")
    .then((userCredential) => {
      console.log(`Server trigger authenticated successfully as admin: ${userCredential.user.email}`);
      console.log("Initiating server trigger batch query loop (checking every 30s)...");

      let isProcessing = false;

      const runPollingCheck = async () => {
        if (isProcessing) return;
        isProcessing = true;

        try {
          const membersCollection = collection(db, "members");
          const q = query(membersCollection, where("status", "==", "approved"));
          const snapshot = await getDocs(q);

          const pendingMembers: { id: string; data: any }[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.email && !data.emailSent) {
              pendingMembers.push({ id: docSnap.id, data });
            }
          });

          if (pendingMembers.length > 0) {
            console.log(`[Polling Trigger] Detected ${pendingMembers.length} approved members requiring email dispatch. Launching spaced batch production...`);

            for (const item of pendingMembers) {
              console.log(`[Polling Trigger] Processing approved member: ${item.data.name} (${item.data.email})`);
              await sendApprovalEmailLocally(item.data, item.id);
              // Wait 3 seconds to be polite to the SMTP relay, avoiding "452 Temporarily Deferred" failures
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
            console.log("[Polling Trigger] Completed batch email processing.");
          }
        } catch (err: any) {
          console.error("Error occurred in local Firestore polling script execution:", err.message || err);
        } finally {
          isProcessing = false;
        }
      };

      // Run initial check and then poll every 30 seconds
      runPollingCheck();
      setInterval(runPollingCheck, 30000);
    })
    .catch((err: any) => {
      console.error("Background server polling trigger auth failed:", err.message || err);
    });
}

// Start watching for Firestore updates
initFirestorePollingTrigger();

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
