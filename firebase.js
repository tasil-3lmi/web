// ==========================================
// Firebase Configuration - معهد التأصيل العلمي
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs
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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ==============================
// إنشاء حساب المشرف العام تلقائياً
// ==============================
async function createSuperAdmin() {
  const adminEmail = "abwdahm645@gmail.com";
  const adminPassword = "12341234";
  try {
    const userCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    await setDoc(doc(db, "users", userCred.user.uid), {
      fullName: "أبو الجواد الحنبلي",
      username: "esero7",
      email: adminEmail,
      role: "superAdmin",
      createdAt: new Date().toISOString()
    });
    console.log("✅ تم إنشاء حساب المشرف العام");
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      console.log("✅ حساب المشرف موجود مسبقاً");
    } else {
      console.error("خطأ:", e.message);
    }
  }
}

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  createSuperAdmin
};
