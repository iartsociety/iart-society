
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyApuGpIIM5xuIURzGjwQA2R0NAmb8aKYR4",
  authDomain: "iart-society.firebaseapp.com",
  projectId: "iart-society",
  storageBucket: "iart-society.firebasestorage.app",
  messagingSenderId: "356382978202",
  appId: "1:356382978202:web:4b654d08e855e3cd5e6f23",
  measurementId: "G-TJXCMSPSZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
const auth = getAuth(app);

// Cloud Firestore
const db = getFirestore(app);

// Export for other JavaScript files
export { app, auth, db };
