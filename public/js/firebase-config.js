// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);