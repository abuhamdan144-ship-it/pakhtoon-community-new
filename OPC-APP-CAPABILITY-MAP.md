# OPC Android App Capability Map

## Objective
Rebuild the OPC Android experience around a branded member portal while preserving the existing Firebase project, historical Firestore database, approved member records, membership-card generator, and website.

| Module | Responsibility | Depends on |
|---|---|---|
| identity | Branded intro animation, member login, new registration, session state | — |
| member-profile | Member details, front/back membership card, downloads, editable name/mobile/photo, immutable Oman ID | identity, existing member-card backend |
| voting | Authenticated member voting with one-vote enforcement per election | identity, member-profile |
| news-events | News and upcoming events feed | identity |
| community-contacts | Emergency and community phone numbers | identity |
| incident-reports | Dead, injured, lost, and found reports with status and moderation | identity |
| release-readiness | Android build, signing, closed test, Play Console release | all modules |

Build order: identity → member-profile → news-events, community-contacts, incident-reports → voting → release-readiness
