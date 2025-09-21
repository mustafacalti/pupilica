// src/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  type Firestore,
  setLogLevel,
  connectFirestoreEmulator,
} from 'firebase/firestore'

// HMR için global pin (TypeScript memnun olsun diye declare)
declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_DB__: Firestore | undefined
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Tekil app (HMR-safe)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)

// ---- Firestore ayarı: SADECE BİRİ aktif ----
// VITE_FIRESTORE_AUTO_DETECT=1 ise AutoDetect; yoksa Force Long-Polling
const useAutoDetect = import.meta.env.VITE_FIRESTORE_AUTO_DETECT === '1'
const dbSettings = useAutoDetect
  ? ({
      experimentalAutoDetectLongPolling: true,
    } as const)
  : ({
      experimentalForceLongPolling: true,
      experimentalLongPollingOptions: { timeoutSeconds: 10 },
    } as const)

// Log seviyesini dev'de kıs
if (import.meta.env.DEV) setLogLevel('warn')

// Tekil db (HMR-safe)
export const db: Firestore =
  globalThis.__FIREBASE_DB__ ??
  (globalThis.__FIREBASE_DB__ = initializeFirestore(app, dbSettings))

// (Opsiyonel) Emülatör: .env'de VITE_USE_FIRESTORE_EMULATOR=1 ise bağlan
if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === '1') {
  try {
    const port =
      Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT) || 8080
    connectFirestoreEmulator(db, '127.0.0.1', port)
  } catch {
    // zaten bağlıysa sessizce geç
  }
}

// Firebase initialized
