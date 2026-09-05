import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function hasFirebaseConfig(): boolean {
  return !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (app) return app;
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID in your environment.");
  }
  if (getApps().length) {
    app = getApps()[0];
  } else {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseApp(): FirebaseApp {
  return getApp();
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getApp());
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (db) return db;
  db = getFirestore(getApp());
  return db;
}

export function isFirebaseConfigured(): boolean {
  return hasFirebaseConfig();
}
