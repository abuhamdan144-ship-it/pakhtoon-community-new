# Spec: OPC Android Member Portal

## Objective
Create a simple, mobile-first OPC Android app that starts with the OPC branded animation, then provides registered members with a name/mobile login and last-four-digit phone PIN. After login, members access five areas: member details and card, voting, news/events, emergency/community contacts, and incident reports.

## Authentication assumptions
- Existing approved members authenticate using either registered full name or registered mobile number.
- Password/PIN is the last four digits of the registered mobile number.
- Only approved members can enter the dashboard.
- New registration remains available from the login screen and creates a pending record for admin approval.
- The Oman ID/card number is immutable after registration.
- No existing Firebase project, named Firestore database, member records, or card records may be deleted.

## Dashboard requirements
1. **Member details**: show profile image, name, mobile, immutable Oman ID, membership ID, location, and approval status. Show the membership card front and back. Provide PDF and PNG download/share actions. Allow the member to edit only name, mobile, and profile image.
2. **Voting**: show active elections configured by admins. A logged-in approved member can cast one vote per election. After submission, show a receipt/status and prevent duplicate votes.
3. **News and upcoming events**: show published news and upcoming events with image, date, location, summary, and details.
4. **Emergency and community numbers**: show tap-to-call numbers with labels for emergency services, OPC leadership, welfare/community support, and other configured contacts.
5. **Reports**: provide separate views/forms for dead, injured, lost, and found reports. Reports include category, person/item name, location, date, description, contact details, and optional image. Admin moderation controls remain authoritative.

## Branding and UX
- Use the existing OPC emblem and forest-green/gold visual system.
- Start with the OPC branded animation, then transition to login.
- Use large labels, simple language, high-contrast controls, and mobile-friendly spacing.
- All screens support Android back navigation and loading/error/success feedback.

## Backend boundaries
- Reuse the existing Firebase project `opc-new-48a8d` and named Firestore database `ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432`.
- Use callable Cloud Functions for unauthenticated card lookup and any sensitive member operations.
- Do not expose direct unauthenticated Firestore member reads.
- Add security rules/functions only after reviewing current production rules and preserving admin access.

## Commands
- Web build: `npm run build`
- Functions build: `cd functions && npm run build`
- Android sync: `npx cap sync android`
- Android debug verification: `cd android && ./gradlew assembleDebug --no-daemon`
- Android release verification: GitHub Actions workflow `.github/workflows/android-release.yml`

## Project structure
- `src/App.jsx`: routing and app shell
- `src/components/MemberPortal.jsx`: member dashboard shell
- `src/components/MemberCard.jsx`: secure card lookup and PDF/PNG actions
- `src/components/MemberCardBuilder.js`: front/back card rendering
- `src/components/News.jsx`, `Incidents.jsx`, `Elections.jsx`: existing content domains to reuse
- `functions/src/index.ts`: callable backend and member operations
- `android/`: Capacitor Android project
- `tasks/`: implementation plan and checklist

## Testing strategy
- Build and lint after each vertical slice.
- Unit-test PIN normalization, immutable Oman ID behavior, and one-vote enforcement.
- Verify approved-member login against a real approved test record without exposing member data.
- Verify card front/back rendering and PDF/PNG downloads.
- Verify security rules deny direct unauthenticated member reads while callable lookup succeeds.
- Verify Android debug build before creating a release artifact.

## Boundaries
- Always: preserve the existing Firebase project/database and live website; validate member approval; preserve immutable Oman ID; run builds before pushing.
- Ask first: deleting data, changing the Firebase project/database, changing the Android package name, changing Play signing identity, or making irreversible Play Console changes.
- Never: commit secrets, delete member records, bypass Firebase authorization, or claim a Play release is live before Google accepts the bundle.

## Success criteria
- OPC branded animation opens the app.
- Login accepts approved member name/mobile plus last-four-digit PIN.
- Approved member reaches the five-tab dashboard.
- Member sees front/back card and can download PDF/PNG.
- Member can edit only name, mobile, and profile image; Oman ID remains unchanged.
- Voting enforces one vote per member per election.
- News/events, contacts, and four report categories render from controlled data sources.
- Existing website and Firebase member-card lookup continue working.
- Android build passes and release status is reported accurately.

## Open decisions
- Admin election configuration and vote-option schema should reuse the existing Elections data model unless incompatible.
- Emergency/community phone numbers should be confirmed from the existing OPC contact data before replacing or adding numbers.
- Report visibility and retention should follow the current admin moderation policy.
