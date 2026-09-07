/**
 * Server-side Firebase Admin SDK.
 * Uses dynamic imports to avoid bundling node: builtins into webpack.
 * Only import in Server Components, API Routes, or Server Actions (Node.js runtime).
 */

let adminAppPromise: Promise<typeof import("firebase-admin/app")> | null = null;

async function getFirebaseAdmin() {
  if (!adminAppPromise) {
    adminAppPromise = import("firebase-admin/app");
  }
  return adminAppPromise;
}

let _adminApp: ReturnType<typeof import("firebase-admin/app")["initializeApp"]> | null = null;

async function getAdminApp() {
  if (_adminApp) return _adminApp;

  const { initializeApp, getApps, cert } = await getFirebaseAdmin();

  if (getApps().length) {
    _adminApp = getApps()[0];
    return _adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    _adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    _adminApp = initializeApp();
  }

  return _adminApp;
}

export async function getAdminFirestore() {
  const app = await getAdminApp();
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(app);
}

export async function getAdminAuth() {
  const app = await getAdminApp();
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(app);
}
