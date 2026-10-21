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


// =========================
// STATE
// =========================
let loginMode = true;


// =========================
// UI MODE SWITCH
// =========================
function setMode(isLogin) {
    loginMode = isLogin;

    // tabs
    loginTab.classList.toggle("active", isLogin);
    signupTab.classList.toggle("active", !isLogin);

    // fields
    nameContainer.classList.toggle("hidden", isLogin);
    confirmContainer.classList.toggle("hidden", isLogin);

    // button text
    submitButton.innerText = isLogin ? "Login" : "Create Account";
}

// default mode
setMode(true);

loginTab.addEventListener("click", () => setMode(true));
signupTab.addEventListener("click", () => setMode(false));


// =========================
// SUBMIT HANDLER
// =========================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    try {

        // =========================
        // LOGIN
        // =========================
        if (loginMode) {

            await signInWithEmailAndPassword(auth, email, password);

            window.location.replace("/index.html");
            return;
        }

        // =========================
        // SIGN UP
        // =========================

        if (!name) {
            alert("Please enter your name.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        // set display name
        await updateProfile(user, {
            displayName: name
        });

        // create Firestore user document
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,

            subscription: "none",
            tokenBalance: 0,

            memberSince: serverTimestamp(),

            purchasedCourses: [],
            purchasedWorkshops: [],

            discountsReceived: 0,
            role: "member"
        });

        window.location.replace("/index.html");

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});


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
        alert(error.message);
    }

      // Existing student: check assigned courses
      const studentData = userSnap.data();
      const courses = studentData.purchasedCourses || [];

      if (Array.isArray(courses) && courses.length > 0) {
        window.location.replace("/courses.html");
      } else {
        window.location.replace("/index.html");
      }

    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Google sign-in failed: " + error.message);
    } finally {
      googleLoginBtn.disabled = false;
    }

  });
}
