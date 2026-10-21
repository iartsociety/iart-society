
import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

console.log("AUTH.JS IS RUNNING");

// =========================
// ELEMENTS
// =========================

const form = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const nameContainer = document.getElementById("nameContainer");
const confirmContainer = document.getElementById("confirmContainer");

const submitButton = document.getElementById("submitButton");
const forgotPassword = document.getElementById("forgotPassword");
const googleLoginBtn = document.getElementById("googleLoginBtn");

let loginMode = true;

// =========================
// LOGIN / SIGNUP TOGGLE
// =========================

function setMode(isLogin) {
  loginMode = isLogin;

  loginTab.classList.toggle("active", isLogin);
  signupTab.classList.toggle("active", !isLogin);

  nameContainer.classList.toggle("hidden", isLogin);
  confirmContainer.classList.toggle("hidden", isLogin);

  submitButton.innerText = isLogin
    ? "Login"
    : "Create Account";

  forgotPassword.style.display = isLogin
    ? ""
    : "none";
}

setMode(true);

loginTab.addEventListener("click", () => setMode(true));
signupTab.addEventListener("click", () => setMode(false));

// =========================
// CREATE STUDENT PROFILE
// =========================

async function ensureStudentProfile(user, name = "") {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      name: name || user.displayName || "",
      email: user.email || "",
      subscription: "none",
      tokenBalance: 0,
      memberSince: serverTimestamp(),
      purchasedCourses: [],
      purchasedWorkshops: [],
      discountsReceived: 0,
      role: "member"
    });
  }

  return userRef;
}

// =========================
// REDIRECT AFTER LOGIN
// =========================

async function redirectStudent(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    window.location.replace("/index.html");
    return;
  }

  const courses = snapshot.data().purchasedCourses;

  if (Array.isArray(courses) && courses.length > 0) {
    window.location.replace("/courses.html");
  } else {
    window.location.replace("/index.html");
  }
}

// =========================
// EMAIL LOGIN / SIGNUP
// =========================

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  submitButton.disabled = true;

  try {
    if (loginMode) {

      // Existing user login
      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await ensureStudentProfile(result.user);
      await redirectStudent(result.user);

    } else {

      // New user registration
      if (!name) {
        alert("Please enter your name.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, {
        displayName: name
      });

      await ensureStudentProfile(result.user, name);
      await redirectStudent(result.user);
    }

  } catch (error) {
    console.error("Authentication error:", error);
    alert("Authentication failed: " + error.message);

  } finally {
    submitButton.disabled = false;
  }
});

// =========================
// GOOGLE LOGIN
// =========================

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    googleLoginBtn.disabled = true;

    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      // Create profile only if it doesn't exist
      await ensureStudentProfile(user);

      // Check courses and redirect
      await redirectStudent(user);

    } catch (error) {
      console.error("Google login error:", error);
      alert("Google sign-in failed: " + error.message);

    } finally {
      googleLoginBtn.disabled = false;
    }
  });
}

// =========================
// FORGOT PASSWORD
// =========================

forgotPassword.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Please enter your email first.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent!");

  } catch (error) {
    console.error("Password reset error:", error);
    alert("Password reset failed: " + error.message);
  }
});
