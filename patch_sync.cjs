const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldSync = `  const syncApprovedMemberCards = async () => {
    if (!window.confirm(\`Create or refresh secure card records for \${approvedMembers.length} approved members?\`)) return;
    setBusy(true);
    try {
      const eligible = approvedMembers.filter((member) => member.membershipId);
      for (let offset = 0; offset < eligible.length; offset += 400) {
        const batch = writeBatch(db);
        eligible.slice(offset, offset + 400).forEach((member) => {
          const membershipId = String(member.membershipId).trim().toUpperCase();
          const cardPin = deriveCardPin(member.phone);
          batch.set(doc(collections.memberCards, membershipId), { membershipId, name: member.name || '', nameKey: String(member.name || '').trim().toLowerCase(), cardPin, omanId: member.omanId || '', phone: normalizePhone(member.phone || ''), photo: String(member.photo || '').length <= 800000 ? member.photo : '', status: 'approved', updatedAt: serverTimestamp() }, { merge: true });
          batch.update(doc(db, 'members', member.id), { cardPin, updatedAt: serverTimestamp() });
        });
        await batch.commit();
      }
      setDataError(eligible.length === approvedMembers.length ? '' : \`\${eligible.length} approved cards synced; \${approvedMembers.length - eligible.length} approved members still need a membership ID.\`);
    } catch (error) {
      setDataError(error?.message || 'Unable to synchronize approved membership cards.');
    } finally { setBusy(false); }
  };`;

const newSync = `  const syncApprovedMemberCards = async () => {
    if (!window.confirm(\`Create or refresh secure card records for \${approvedMembers.length} approved members?\`)) return;
    setBusy(true);
    // Yield to the main thread so the UI can update the button state to "disabled" and show loaders before heavy operations.
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      const eligible = approvedMembers.filter((member) => member.membershipId);
      // Process in smaller batches of 200 to strictly respect Firestore's 500 operation limit per batch (we do 2 operations per member).
      for (let offset = 0; offset < eligible.length; offset += 200) {
        const batch = writeBatch(db);
        eligible.slice(offset, offset + 200).forEach((member) => {
          const membershipId = String(member.membershipId).trim().toUpperCase();
          const cardPin = deriveCardPin(member.phone);
          batch.set(doc(collections.memberCards, membershipId), { membershipId, name: member.name || '', nameKey: String(member.name || '').trim().toLowerCase(), cardPin, omanId: member.omanId || '', phone: normalizePhone(member.phone || ''), photo: String(member.photo || '').length <= 800000 ? member.photo : '', status: 'approved', updatedAt: serverTimestamp() }, { merge: true });
          batch.update(doc(db, 'members', member.id), { cardPin, updatedAt: serverTimestamp() });
        });
        await batch.commit();
        // Yield to the main thread after each batch to prevent UI blocking for long periods.
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      setDataError(eligible.length === approvedMembers.length ? '' : \`\${eligible.length} approved cards synced; \${approvedMembers.length - eligible.length} approved members still need a membership ID.\`);
    } catch (error) {
      setDataError(error?.message || 'Unable to synchronize approved membership cards.');
    } finally { setBusy(false); }
  };`;

if (content.includes("offset += 400")) {
  content = content.replace(oldSync, newSync);
  fs.writeFileSync(file, content);
  console.log("Patched syncApprovedMemberCards");
} else {
  console.log("Could not find old syncApprovedMemberCards");
}
