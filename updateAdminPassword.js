import admin from 'firebase-admin';

admin.initializeApp();

async function update() {
  try {
    const user = await admin.auth().getUserByEmail('admin@opc.com');
    await admin.auth().updateUser(user.uid, { password: '123456' });
    console.log('Password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error.message);
  }
  process.exit(0);
}
update();
