import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({
  projectId: "opc-new-48a8d"
});

async function listAllUsers(nextPageToken) {
  let count = 0;
  try {
    const listUsersResult = await getAuth().listUsers(1000, nextPageToken);
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
