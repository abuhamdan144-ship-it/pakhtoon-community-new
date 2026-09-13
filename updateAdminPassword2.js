import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

async function update() {
  try {
    const user = await getAuth().getUserByEmail('admin@opc.com');
    await getAuth().updateUser(user.uid, { password: '123456' });
    console.log('Password updated successfully');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      try {
        await getAuth().createUser({
          email: 'admin@opc.com',
          password: '123456',
        });
        console.log('User created successfully');
      } catch (e2) {
        console.error('Error creating user:', e2.message);
      }
    } else {
      console.error('Error updating password:', error.message);
    }
  }
  process.exit(0);
}
update();
