import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { doc, getDoc, runTransaction }
  from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

async function loadCourseCatalog() {
  const response = await fetch("/json/course_catalog.json", {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load course catalog: ${response.status}`
    );
  }

  return await response.json();
}

// Convert a short course code into its Firestore course ID
async function getCourseId(shortCode) {
  const catalog = await loadCourseCatalog();

  const match = Object.entries(catalog).find(
    ([courseId, course]) =>
      course.courseCode?.toUpperCase() === shortCode.toUpperCase()
  );

  if (!match) {
    throw new Error("Invalid course code.");
  }

  return match[0];
}


const container =
  document.getElementById("courses-container");

function showMessage(message) {
  container.textContent = "";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  container.appendChild(paragraph);
}

// Display courses assigned to this student
function displayCourses(courseIds, courseCatalog) {
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

// Load course information from JSON
const courseCatalog = courseIds.length
  ? await loadCourseCatalog()
  : {};

// Display the student's assigned courses
displayCourses(courseIds, courseCatalog);


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

const codeInput =
  document.getElementById("course-code-input");

if (unlockButton && codeInput) {

  unlockButton.addEventListener("click", async () => {
    const user = auth.currentUser;
    const code = codeInput.value.trim().toUpperCase();

    if (!user) {
      alert("Please log in before activating a course.");
      return;
    }

    if (!code) {
      alert("Please enter your activation code.");
      return;
    }

    
unlockButton.disabled = true;

try {
  // Read the short course code from the popup
  const shortCodeInput =
    document.getElementById("course-short-code");

  const shortCode = shortCodeInput
    ? shortCodeInput.value.trim().toUpperCase()
    : "";

  if (!shortCode) {
    throw new Error("Please enter your course code.");
  }

  // Resolve MEEN2D into meenakshi-2d-tanjore
  const courseId = await getCourseId(shortCode);

  // Find the student account
  const userRef = doc(db, "users", user.uid);

  
const lookupRef = doc(db, "activationCodeLookup", code);

const lookupSnap = await transaction.get(lookupRef);

if (!lookupSnap.exists()) {
  throw new Error("Invalid activation code.");
}

const lookup = lookupSnap.data();

if (lookup.courseId !== courseId) {
  throw new Error("Activation code does not match this course.");
}

const groupId = lookup.groupId;

const codeRef = doc(
  db,
  "activationCodes",
  courseId,
  "groups",
  groupId,
  "codes",
  code
);


      await runTransaction(db, async transaction => {
        const codeSnap = await transaction.get(codeRef);
        const userSnap = await transaction.get(userRef);

        if (!codeSnap.exists()) {
          throw new Error("Invalid activation code.");
        }

        if (!userSnap.exists()) {
          throw new Error("Student profile not found.");
        }

        const activation = codeSnap.data();
        const student = userSnap.data();

        if (activation.redeemedBy !== null) {
          throw new Error("This code has already been used.");
        }

        const currentCourses = Array.isArray(
          student.purchasedCourses
        ) ? student.purchasedCourses : [];

        if (currentCourses.includes(courseId)) {
          throw new Error("You already have this course.");
        }

        transaction.update(userRef, {
          purchasedCourses: [...currentCourses, courseId],
          lastRedeemedCode: code
        });

        transaction.update(codeRef, {
          redeemedBy: user.uid
        });
      });

      alert("Course activated successfully!");
      window.location.reload();

    } catch (error) {
      console.error("Activation failed:", error);

      alert(
        error.code === "permission-denied"
          ? "Activation was denied. Please contact iArtSociety."
          : error.message || "Unable to activate course."
      );

    } finally {
      unlockButton.disabled = false;
    }
  });
}

