
import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { doc, getDoc }
  from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Course catalog
// These are course descriptions, NOT unlock codes.


const courseCatalog = {
  "lotus-lippan-art": {
    title: "Lotus Lippan Art",
    page: "/lotus.html",
    image: "/lla-gallery/lotus-course.jpg"
  },

  "tree-of-life": {
    title: "Tree Of Life",
    page: "/tree.html",
    image: "/tree-course.jpeg"
  }
};


const container =
  document.getElementById("courses-container");

function showMessage(message) {
  container.textContent = "";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  container.appendChild(paragraph);
}

// Display courses assigned to this student
function displayCourses(courseIds) {
  container.textContent = "";

  if (!courseIds.length) {
    showMessage(
      "You don't have any courses assigned yet."
    );
    return;
  }

  courseIds.forEach(courseId => {
    const course = courseCatalog[courseId];

    if (!course) return;

    const link = document.createElement("a");
    link.className = "course-card";
    link.href = course.page;

    const image = document.createElement("img");
    image.src = course.image;
    image.alt = course.title;
    image.className = "course-image";

    const info = document.createElement("div");
    info.className = "course-info";

    const title = document.createElement("p");
    title.textContent = course.title;

    info.appendChild(title);
    link.appendChild(image);
    link.appendChild(info);
    container.appendChild(link);
  });

  if (!container.children.length) {
    showMessage(
      "Your assigned courses aren't available in the catalog yet."
    );
  }
}

// Check Firebase login and load student profile
showMessage("Loading your courses...");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      showMessage("Student profile not found.");
      return;
    }

    const student = snapshot.data();

    const courseIds = Array.isArray(
      student.purchasedCourses
    ) ? student.purchasedCourses : [];

    displayCourses(courseIds);

  } catch (error) {
    console.error("Course loading error:", error);
    showMessage(
      "Unable to load your courses. Please try again."
    );
  }
});

// Manual enrollment is currently enabled.
// Disable the old browser-based course code system.

const unlockButton =
  document.getElementById("submit-code-btn");

if (unlockButton) {
  unlockButton.addEventListener("click", () => {
    alert(
      "Course activation is currently handled by iArt Society. Please contact us to activate your course."
    );
  });
}

 // =========================
 // LOG OUT
 // =========================

const logoutButton = document.getElementById("logout-btn");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      logoutButton.disabled = true;

      await signOut(auth);

      // Return to login page
      window.location.replace("/login.html");

    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to log out. Please try again.");
      logoutButton.disabled = false;
    }
  });
}
