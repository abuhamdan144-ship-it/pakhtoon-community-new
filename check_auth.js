import admin from 'firebase-admin';

admin.initializeApp({
  projectId: "opc-new-48a8d",
  credential: admin.credential.applicationDefault()
});

async function listAllUsers(nextPageToken) {
  let count = 0;
  try {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    count += listUsersResult.users.length;
    if (listUsersResult.pageToken) {
      count += await listAllUsers(listUsersResult.pageToken);
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
  return count;
}

listAllUsers().then(count => {
  console.log(`Total users in Auth: ${count}`);
  process.exit(0);
});
