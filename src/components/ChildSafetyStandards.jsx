import React from 'react';

export default function ChildSafetyStandards() {
  return (
    <main className="min-h-screen bg-cream px-5 py-12 text-text sm:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-xl sm:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Oman Pakhtoon Community (OPC)</p>
        <h1 className="mb-8 text-4xl font-bold text-emerald-950">Child Safety Standards</h1>

        <section className="space-y-5 leading-7 text-slate-700">
          <p>These standards apply to the OPC website, Android application, and community services.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Zero tolerance for child sexual abuse and exploitation</h2>
          <p>OPC prohibits child sexual abuse and exploitation (CSAE), child sexual abuse material (CSAM), grooming, sexual exploitation or sexualization of children, sextortion, trafficking, and any conduct or content that endangers a child. Users must not create, upload, share, request, link to, or otherwise distribute CSAM or use OPC services to facilitate the abuse or exploitation of a child. We do not knowingly permit our services to be used for these purposes.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">How to report a concern</h2>
          <p>In the Android app, a signed-in member can open <strong>Member Portal → Emergency contact &amp; report</strong>, choose <strong>Welfare assistance</strong>, describe the concern in the report form, and submit it. Reports are stored for review by authorized OPC administrators. You may also report a child-safety concern to the designated contact below. Suspected CSAE/CSAM reports will be treated as urgent. Do not attach, upload, or resend illegal material; provide a description and relevant account or public-link details instead.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Review and enforcement</h2>
          <p>Authorized OPC administrators review submitted reports. Where appropriate and technically possible, OPC will remove or disable access to prohibited content and may restrict access to OPC services for accounts that violate these standards. OPC will take appropriate action when it obtains actual knowledge of CSAM, consistent with these standards and applicable law.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Legal compliance and reporting confirmed CSAM</h2>
          <p>OPC will comply with applicable child-safety laws and regulations. OPC’s process is to report confirmed CSAM to the National Center for Missing &amp; Exploited Children (NCMEC) or the relevant regional/national authority, as appropriate and consistent with applicable law, and preserve relevant information where legally permitted. If a child is in immediate danger, contact local emergency services or law enforcement.</p>

          <h2 className="pt-4 text-2xl font-semibold text-emerald-950">Child-safety point of contact</h2>
          <p>For child-safety reports and Google Play notifications concerning CSAE, contact <a className="font-semibold text-emerald-700 underline" href="mailto:abuhamdan144@gmail.com">abuhamdan144@gmail.com</a>. This is OPC’s designated child-safety point of contact and is responsible for receiving these reports, discussing OPC’s review and enforcement procedures, and coordinating appropriate action.</p>
        </section>
      </article>
    </main>
  );
}
