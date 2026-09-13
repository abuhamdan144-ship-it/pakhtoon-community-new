const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add startTransition to import React if not there
if (content.includes("import React, { useEffect, useMemo, useState } from 'react';")) {
  content = content.replace("import React, { useEffect, useMemo, useState } from 'react';", "import React, { useEffect, useMemo, useState, startTransition } from 'react';");
} else if (!content.includes('startTransition')) {
  content = content.replace("from 'react';", ", startTransition } from 'react';").replace("import React", "import React, { startTransition");
}

const originalStartMemberEdit = `  const startMemberEdit = (member) => {
    setCreatingMember(false);
    setEditingMember(member);
    setMemberDraft({
      name: member.name || '', father: member.father || '', phone: member.phone || '', omanId: member.omanId || '', omanLocation: member.omanLocation || '', district: member.district || '', address: member.address || '', membershipId: member.membershipId || '', cardPin: member.cardPin || '', status: member.status || 'pending', photo: member.photo || '',
    });
  };`;

const newStartMemberEdit = `  const startMemberEdit = (member) => {
    startTransition(() => {
      setCreatingMember(false);
      setEditingMember(member);
      setMemberDraft({
        name: member.name || '', father: member.father || '', phone: member.phone || '', omanId: member.omanId || '', omanLocation: member.omanLocation || '', district: member.district || '', address: member.address || '', membershipId: member.membershipId || '', cardPin: member.cardPin || '', status: member.status || 'pending', photo: member.photo || '',
      });
    });
  };`;

content = content.replace(originalStartMemberEdit, newStartMemberEdit);

const originalStartNewMember = `  const startNewMember = () => {
    setEditingMember(null);
    setCreatingMember(true);
    setMemberDraft({ name: '', father: '', phone: '', omanId: '', omanLocation: '', district: '', address: '', membershipId: '', status: 'pending', photo: '' });
  };`;

const newStartNewMember = `  const startNewMember = () => {
    startTransition(() => {
      setEditingMember(null);
      setCreatingMember(true);
      setMemberDraft({ name: '', father: '', phone: '', omanId: '', omanLocation: '', district: '', address: '', membershipId: '', status: 'pending', photo: '' });
    });
  };`;

content = content.replace(originalStartNewMember, newStartNewMember);

fs.writeFileSync(file, content);
console.log("Patched startMemberEdit and startNewMember with startTransition");
