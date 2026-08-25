import { onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";
import { google } from "googleapis";
import { Readable } from "stream";

// Initialize the Firebase Admin SDK against the recovered named OPC database.
const app = initializeApp();
const FIRESTORE_DATABASE_ID = "ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432";
const db = getFirestore(app, FIRESTORE_DATABASE_ID);
const storageBucket = getStorage(app).bucket();

function normalisePhone(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

function phoneMatches(left: string, right: string): boolean {
  const a = normalisePhone(left);
  const b = normalisePhone(right);
  if (!a || !b) return false;
  // The member form has historically stored Oman numbers as 8 digits, +968XXXXXXXX,
  // or 00968XXXXXXXX. Comparing the final eight digits supports all three formats.
  return a === b || a.slice(-8) === b.slice(-8);
}

function nameKey(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export const lookupMemberCardByPin = onCall({ region: "us-central1" }, async (request) => {
  const lookup = String(request.data?.lookup || "").trim();
  const pin = String(request.data?.pin || "").replace(/\D/g, "");
  if (!lookup || !/^\d{4}$/.test(pin)) {
    throw new HttpsError("invalid-argument", "Enter the approved member name or mobile number and the last four phone digits.");
  }

  const looksLikePhone = /^\+?\d[\d\s()-]{7,}$/.test(lookup);
  // Read-only server-side fallback: older deployments did not create memberCards for
  // every approved member, so the authoritative members collection must also be checked.
  const [cardSnapshot, memberSnapshot] = await Promise.all([
    db.collection("memberCards").where("status", "==", "approved").get(),
    db.collection("members").where("status", "==", "approved").get(),
  ]);
  const candidates: Array<Record<string, unknown>> = [
    ...cardSnapshot.docs.map((entry) => ({ ...entry.data(), source: "card" })),
    ...memberSnapshot.docs.map((entry) => ({ ...entry.data(), source: "member" })),
  ];
  const card = candidates.find((candidate) => {
    if (candidate.status !== "approved") return false;
    const lookupMatches = looksLikePhone
      ? phoneMatches(lookup, String(candidate.phone || ""))
      : nameKey(lookup) === nameKey(String(candidate.nameKey || candidate.name || ""));
    const expectedPin = String(candidate.cardPin || normalisePhone(String(candidate.phone || "")).slice(-4));
    return lookupMatches && expectedPin === pin;
  });
  if (!card) {
    throw new HttpsError("not-found", "No approved membership card matched these details.");
  }

  return {
    approved: true,
    name: String(card.name || ""),
    membershipId: String(card.membershipId || "OPC-MEMBER"),
    photo: String(card.photo || ""),
    status: "approved",
  };
});
const BACKUP_COLLECTIONS = ["members", "memberCards", "cabinet", "events", "news", "donations", "incidents", "elections", "ads", "comments", "settings", "admin_logs", "cabinet_meetings"];


/**
 * Lazy-initializer helper to configure SMTP Nodemailer transport.
 * Retrieves secrets securely from environment variables.
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    logger.warn("SMTP credentials (SMTP_USER/SMTP_PASS) are not defined. Email dispatch will be simulated in logger output.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Cloud Function Trigger: Listen to document updates on 'members/{memberId}' collection.
 * Triggers when a member's status is changed from 'pending' (or others) to 'approved'.
 */
function serialiseBackupValue(value: unknown): unknown {
  if (value instanceof Timestamp) return { __type: "timestamp", value: value.toDate().toISOString() };
  if (Array.isArray(value)) return value.map(serialiseBackupValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, serialiseBackupValue(entry)]));
  return value;
}

export const monthlyOpcBackup = onSchedule({
  schedule: "0 2 1 * *",
  timeZone: "Asia/Muscat",
  region: "us-central1",
}, async () => {
  const collections: Record<string, Record<string, unknown>[]> = {};
  for (const collectionName of BACKUP_COLLECTIONS) {
    const snapshot = await db.collection(collectionName).get();
    collections[collectionName] = snapshot.docs.map((entry) => ({ id: entry.id, data: serialiseBackupValue(entry.data()) as Record<string, unknown> }));
  }
  const generatedAt = new Date().toISOString();
  const payload = JSON.stringify({ schemaVersion: 1, generatedAt, projectId: "opc-new-48a8d", databaseId: FIRESTORE_DATABASE_ID, collections }, null, 2);
  const filePath = `opc-backups/${generatedAt.slice(0, 7)}/opc-firestore-${generatedAt.replace(/[:.]/g, "-")}.json`;
  const file = storageBucket.file(filePath);
  await file.save(Buffer.from(payload), { contentType: "application/json", resumable: false, metadata: { metadata: { generatedAt, databaseId: FIRESTORE_DATABASE_ID, retentionMonths: "12" } } });

  const driveFolderId = process.env.OPC_BACKUP_DRIVE_FOLDER_ID;
  if (driveFolderId) {
    try {
      const googleAuth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive.file"] });
      const drive = google.drive({ version: "v3", auth: googleAuth });
      await drive.files.create({ requestBody: { name: `opc-firestore-${generatedAt.replace(/[:.]/g, "-")}.json`, mimeType: "application/json", parents: [driveFolderId] }, media: { mimeType: "application/json", body: Readable.from([payload]) }, fields: "id,name" });
      logger.info("Monthly OPC backup copied to the private Google Drive folder.");
    } catch (error) {
      logger.warn(`Firebase Storage backup succeeded, but Google Drive copy failed: ${String(error)}`);
    }
  } else {
    logger.warn("OPC_BACKUP_DRIVE_FOLDER_ID is not configured; monthly backup is currently stored only in private Firebase Storage.");
  }

  const [files] = await storageBucket.getFiles({ prefix: "opc-backups/" });
  const datedFiles = files.filter((candidate) => candidate.name.endsWith(".json")).sort((a, b) => String(b.metadata.updated || "").localeCompare(String(a.metadata.updated || "")));
  await Promise.all(datedFiles.slice(12).map((candidate) => candidate.delete()));
  logger.info(`Monthly OPC backup saved to ${filePath}; retained ${Math.min(12, datedFiles.length)} copies.`);
});

export const refreshPublicMemberStats = onDocumentWritten({
  document: "members/{memberId}",
  database: FIRESTORE_DATABASE_ID,
}, async () => {
  const snapshot = await db.collection("members").get();
  const totalMembers = snapshot.size;
  const approvedMembers = snapshot.docs.filter((member) => member.data().status === "approved").length;
  await db.doc("settings/publicStats").set({ totalMembers, approvedMembers, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  logger.info(`Updated public member stats: ${approvedMembers} approved of ${totalMembers} total.`);
});

export const onMemberStatusUpdated = onDocumentUpdated({
  document: "members/{memberId}",
  database: FIRESTORE_DATABASE_ID,
}, async (event) => {
  const memberId = event.params.memberId;
  const change = event.data;

  if (!change) {
    logger.error(`No change data found for member ${memberId}`);
    return;
  }

  const beforeData = change.before.data();
  const afterData = change.after.data();

  if (!beforeData || !afterData) {
    logger.error(`Document data state is invalid for member ${memberId}`);
    return;
  }

  const statusBefore = beforeData.status;
  const statusAfter = afterData.status;
  const email = afterData.email;

  logger.info(`Triggered onMemberStatusUpdated for member ${memberId}. Status transition: ${statusBefore} -> ${statusAfter}`);

  // Only dispatch when status has changed to 'approved' and they had not been previously notified/processed
  if (statusAfter === "approved" && statusBefore !== "approved") {
    if (!email) {
      logger.warn(`No email address on record for approved member ${memberId} (${afterData.name || "Unknown"}). Cannot send notification.`);
      return;
    }

    const membershipId = afterData.membershipId || "N/A";
    const name = afterData.name || "Member";
    const father = afterData.father || "-";
    const cnic = afterData.cnic || "-";
    const district = afterData.district || "-";

    logger.info(`Processing approval email notification for ${email} with Membership ID: ${membershipId}`);

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

    const transporter = getEmailTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Oman Pakhtoon Community" <${process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER}>`,
          to: email,
          subject: `🟢 OPC Lifetime Membership Officially Approved - ID: ${membershipId}`,
          text: `Assalam-o-Alaikum ${name},\n\nYour association application with the Oman Pakhtoon Community has been approved.\nIssued Membership ID: ${membershipId}\nFather's Name: ${father}\nCNIC/Passport: ${cnic}\nDistrict/Tribe: ${district}\n\nPlease visit the OPC portal to generate and download your identity cards and certificates.\n\nBest regards,\nOPC Executive Council Board`,
          html: htmlContent,
        });
        logger.info(`Approval email successfully sent to ${email} for member ${memberId}`);

        // Mark that notification email has been dispatched
        await db.collection("members").doc(memberId).set({
          emailSent: true,
          emailSentAt: FieldValue.serverTimestamp()
        }, { merge: true });

      } catch (err) {
        logger.error(`Failed to send email via SMTP transporter to ${email}:`, err);
      }
    } else {
      // SMTP credentials are not configured, simulate by printing to log
      logger.info(`[SIMULATION] Sending enrollment approval email to ${email}`);
      logger.info(`[SIMULATION] Mail Body Reference: Name: ${name}, Issued ID: ${membershipId}`);
      
      // Still write status update so the local database stays in sync and we don't spam the log repeatedly
      await db.collection("members").doc(memberId).set({
        emailSent: true,
        emailSentAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }
});
