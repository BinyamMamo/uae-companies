import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/**
 * Firebase is optional and loaded on demand.
 *
 * With no config the app runs exactly as before — everything stays in
 * localStorage and the sign-in UI is hidden. Even when configured, the SDK is
 * dynamically imported so it never lands in the initial bundle (it is ~800KB
 * uncompressed, on a page whose primary job is to render a list fast).
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isAuthConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId
);

/**
 * Analytics additionally needs a measurementId, which only exists once a
 * Google Analytics property is linked to the Firebase project. Without it the
 * app runs normally and simply reports nothing.
 */
export const isAnalyticsConfigured = Boolean(
  isAuthConfigured && config.measurementId
);

export interface FirebaseBundle {
  app: import('firebase/app').FirebaseApp;
  auth: Auth;
  db: Firestore;
  signInWithPopup: typeof import('firebase/auth').signInWithPopup;
  signInWithCredential: typeof import('firebase/auth').signInWithCredential;
  signOut: typeof import('firebase/auth').signOut;
  onAuthStateChanged: typeof import('firebase/auth').onAuthStateChanged;
  GoogleAuthProvider: typeof import('firebase/auth').GoogleAuthProvider;
  googleProvider: import('firebase/auth').GoogleAuthProvider;
  doc: typeof import('firebase/firestore').doc;
  getDoc: typeof import('firebase/firestore').getDoc;
  setDoc: typeof import('firebase/firestore').setDoc;
  serverTimestamp: typeof import('firebase/firestore').serverTimestamp;
}

let bundlePromise: Promise<FirebaseBundle> | null = null;

export function loadFirebase(): Promise<FirebaseBundle> | null {
  if (!isAuthConfigured) return null;

  bundlePromise ??= (async () => {
    const [{ initializeApp }, authMod, firestoreMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]);

    const app = initializeApp({
      apiKey: config.apiKey!,
      authDomain: config.authDomain!,
      projectId: config.projectId!,
      appId: config.appId!,
      ...(config.measurementId ? { measurementId: config.measurementId } : {}),
    });

    const googleProvider = new authMod.GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    return {
      app,
      auth: authMod.getAuth(app),
      db: firestoreMod.getFirestore(app),
      signInWithPopup: authMod.signInWithPopup,
      signInWithCredential: authMod.signInWithCredential,
      signOut: authMod.signOut,
      onAuthStateChanged: authMod.onAuthStateChanged,
      GoogleAuthProvider: authMod.GoogleAuthProvider,
      googleProvider,
      doc: firestoreMod.doc,
      getDoc: firestoreMod.getDoc,
      setDoc: firestoreMod.setDoc,
      serverTimestamp: firestoreMod.serverTimestamp,
    };
  })();

  return bundlePromise;
}

export type { User };
