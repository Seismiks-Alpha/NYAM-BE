import admin from 'firebase-admin';

// Ambil dari Firebase Console → Project Settings → Service Account → Generate New Private Key
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
