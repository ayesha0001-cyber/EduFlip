import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfigJson) : getApp();

// Target provisioned Firestore Database with long-polling to prevent WebSocket connection failures in sandboxed iframe environments
export const db: Firestore = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfigJson.firestoreDatabaseId || '(default)'
);

export const auth: Auth = getAuth(app);

export default app;
