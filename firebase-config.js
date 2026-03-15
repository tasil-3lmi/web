// Firebase Configuration
const _fbConfig = {
  apiKey: "AIzaSyC1sZ0cJeQMJ6QdnxwFkcfK3AGir0TRuuk",
  authDomain: "tasil-3lmi.firebaseapp.com",
  projectId: "tasil-3lmi",
  storageBucket: "tasil-3lmi.firebasestorage.app",
  messagingSenderId: "596405733121",
  appId: "1:596405733121:web:38ebadcc9eef8d8bb77d00",
  measurementId: "G-L7Z7LBH42Z"
};
firebase.initializeApp(_fbConfig);
const FB_AUTH = firebase.auth();
const FB_DB   = firebase.firestore();
try { firebase.analytics(); } catch(e){}
