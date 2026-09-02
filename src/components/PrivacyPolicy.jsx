import React from 'react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-cream px-5 py-12 text-text sm:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-xl sm:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Oman Pakhtoon Community</p>
        <h1 className="mb-4 text-4xl font-bold text-emerald-950">Privacy Policy</h1>
        <p className="mb-8 text-sm text-slate-600">Last updated: 2 September 2026</p>

        <section className="space-y-5 leading-7 text-slate-700">
          <p>This Privacy Policy explains how the Oman Pakhtoon Community (OPC) handles information submitted through the OPC website and Android application.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Information we collect</h2>
          <p>When a person applies for membership, OPC may collect their name, mobile number, email address, Oman ID card number, Oman location, and optional profile or membership-card images. Existing members may provide their name or mobile number and a PIN made from the last four digits of their registered phone number to find an approved digital membership card.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">How we use information</h2>
          <p>We use submitted information to process membership applications, verify approval status, provide approved members with their digital membership card, contact members about membership matters, operate community content, and maintain the security and reliability of the portal.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Storage and service providers</h2>
          <p>OPC stores membership information and submitted images using Google Firebase services, including Firestore and Firebase Storage. Access is limited by the application’s security rules and administrator permissions. OPC does not sell member information.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Sharing</h2>
          <p>OPC does not sell personal information or use it for advertising. Information may be accessed by authorized OPC administrators and by service providers required to operate Firebase-hosted storage, authentication, and application infrastructure. We may disclose information when required by applicable law.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Ads and advertising identifiers</h2>
          <p>The OPC Android application does not contain advertising and does not use advertising identifiers for advertising.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Retention and deletion</h2>
          <p>OPC retains membership records for community administration and recordkeeping for as long as reasonably necessary. A member may request correction or deletion of information by contacting OPC. Some records may need to be retained for legitimate administrative, legal, or historical purposes.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Children’s privacy</h2>
          <p>The OPC application is a community membership service and is not directed to children. We do not knowingly request personal information from children for independent registration.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Contact</h2>
          <p>For privacy questions, correction requests, or deletion requests, contact OPC at <a className="font-semibold text-emerald-700 underline" href="mailto:abuhamdan144@gmail.com">abuhamdan144@gmail.com</a>.</p>
        </section>
      </article>
    </main>
  );
}
