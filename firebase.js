// ==========================================
// Firebase Configuration - معهد التأصيل العلمي
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1sZ0cJeQMJ6QdnxwFkcfK3AGir0TRuuk",
  authDomain: "tasil-3lmi.firebaseapp.com",
  projectId: "tasil-3lmi",
  storageBucket: "tasil-3lmi.firebasestorage.app",
  messagingSenderId: "596405733121",
  appId: "1:596405733121:web:38ebadcc9eef8d8bb77d00",
  measurementId: "G-L7Z7LBH42Z"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── تعيين الاستمرارية مرة واحدة عند تهيئة التطبيق ──
// هذا يُغني عن استدعاء setPersistence قبل كل عملية دخول
setPersistence(auth, browserLocalPersistence).catch(() => {});

// ── Analytics تُحمَّل في الخلفية فقط — لا تعيق التحميل ──
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js")
      .then(({ getAnalytics }) => getAnalytics(app))
      .catch(() => {});
  });
}

export {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc, setDoc, getDoc, updateDoc,
  collection, getDocs, deleteDoc, addDoc
};
