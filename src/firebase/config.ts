import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const ALLOWED_DOMAIN = 'ssis.edu.vn';
export const ADMIN_EMAIL = 'lmeldrum@ssis.edu.vn';

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: ALLOWED_DOMAIN });
