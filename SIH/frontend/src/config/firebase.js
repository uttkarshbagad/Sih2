import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB1-FNNMGETQPuPnfryIbS6uc_ZhjqyOyo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fir-f4bd4.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://fir-f4bd4-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fir-f4bd4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fir-f4bd4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "780901062893",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:780901062893:web:538d745d9ea3c6517e14e4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-77BREWHFSX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firebase Analytics
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { RecaptchaVerifier, signInWithPhoneNumber };
export default app;
