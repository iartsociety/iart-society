
import { auth, db } from "/js/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ========================================
// COURSE CATALOG
// ========================================

async function loadCourseCatalog() {
  const response = await fetch(
    "/json/course_catalog.json",
    { cache: "no-cache" }
  );

  if (!response.ok) {
    throw new Error("Unable to load course catalog.");
  }

  return await response.json();
}


// Convert M2D into meenakshi-2d-tanjore
async function getCourseId(shortCode) {
  const catalog = await loadCourseCatalog();

  const match = Object.entries(catalog).find(
    ([id, course]) =>
      typeof course.courseCode === "string" &&
      course.courseCode.toUpperCase() === shortCode
  );

  if (!match) {
    throw new Error("Invalid course code.");
  }

  return match[0];
}


// ========================================
// DISPLAY STUDENT COURSES
// ========================================

const container =
  document.getElementById("courses-container");

function showMessage(message) {
  if (!container) return;

  container.textContent = "";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  container.appendChild(paragraph);
}

function displayCourses(courseIds, catalog) {
  if (!container) return;

  container.textContent = "";

  if (!courseIds.length) {
    showMessage("You don't have any courses assigned yet.");
    return;
  }

  courseIds.forEach(courseId => {
    const course = catalog[courseId];

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

async function loadStudentCourses(user) {
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

  const catalog = courseIds.length
    ? await loadCourseCatalog()
    : {};

  displayCourses(courseIds, catalog);
}


// ========================================
// AUTHENTICATION
// ========================================

showMessage("Loading your courses...");

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  try {
    await loadStudentCourses(user);
  } catch (error) {
    console.error("Course loading error:", error);
    showMessage("Unable to load your courses.");
  }
});


// ========================================
// ACTIVATE COURSE
// ========================================

const unlockButton =
  document.getElementById("submit-code-btn");

const codeInput =
  document.getElementById("course-code-input");

const shortCodeInput =
  document.getElementById("course-short-code");

if (unlockButton && codeInput && shortCodeInput) {

  unlockButton.addEventListener("click", async () => {

    const user = auth.currentUser;

    const shortCode = shortCodeInput.value
      .trim()
      .toUpperCase();

    const code = codeInput.value
      .trim()
      .toUpperCase();

    if (!user) {
      alert("Please sign in first.");
      return;
    }

    if (!shortCode) {
      alert("Please enter the course code.");
      return;
    }

    if (!code) {
      alert("Please enter the activation code.");
      return;
    }

    unlockButton.disabled = true;

    try {

      // 1. Resolve the short course code
      const courseId = await getCourseId(shortCode);

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      // 2. Locate the activation-code lookup
      const lookupRef = doc(
        db,
        "activationCodeLookup",
        code
      );

      // 3. Redeem atomically
      await runTransaction(db, async transaction => {

        // READ 1: Find the learning group
        const lookupSnap =
          await transaction.get(lookupRef);

        if (!lookupSnap.exists()) {
          throw new Error("Invalid activation code.");
        }

        const lookup = lookupSnap.data();

        if (lookup.courseId !== courseId) {
          throw new Error(
            "This activation code belongs to another course."
          );
        }

        const groupId = lookup.groupId;

        if (
          typeof groupId !== "string" ||
          !/^[a-z0-9-]+$/.test(groupId)
        ) {
          throw new Error("Invalid learning group.");
        }

        // 4. Locate the code within its learning group
        const codeRef = doc(
          db,
          "activationCodes",
          courseId,
          "groups",
          groupId,
          "codes",
          code
        );

        // READ 2 and READ 3
        // All transaction reads happen before writes.
        const codeSnap =
          await transaction.get(codeRef);

        const userSnap =
          await transaction.get(userRef);

        if (!codeSnap.exists()) {
          throw new Error("Activation code not found.");
        }

        if (!userSnap.exists()) {
          throw new Error("Student profile not found.");
        }

        const activation = codeSnap.data();
        const student = userSnap.data();

        if (activation.redeemedBy !== null) {
          throw new Error(
            "This activation code has already been used."
          );
        }

        const currentCourses = Array.isArray(
          student.purchasedCourses
        ) ? student.purchasedCourses : [];

        const currentCodes = Array.isArray(
          student.redeemedCodes
        ) ? student.redeemedCodes : [];

        const currentGroups =
          student.courseGroups &&
          typeof student.courseGroups === "object" &&
          !Array.isArray(student.courseGroups)
            ? student.courseGroups
            : {};

        if (currentCourses.includes(courseId)) {
          throw new Error(
            "You already have access to this course."
          );
        }

        const redemptionRecord =
          `${courseId}:${groupId}:${code}`;

        // WRITE 1: Update student account
        // Preserve all existing courses and redemption records.
        transaction.update(userRef, {
          purchasedCourses: [
            ...currentCourses,
            courseId
          ],

          courseGroups: {
            ...currentGroups,
            [courseId]: groupId
          },

          redeemedCodes: [
            ...currentCodes,
            redemptionRecord
          ],

          lastRedeemedCourseId: courseId,
          lastRedeemedGroupId: groupId,
          lastRedeemedCode: code
        });

        // WRITE 2: Mark the code as redeemed
        transaction.update(codeRef, {
          redeemedBy: user.uid,
          redeemedAt: serverTimestamp()
        });

      });

      alert("Course activated successfully!");

      window.location.reload();

    } catch (error) {
      console.error("Activation failed:", error);

      alert(
        error.code === "permission-denied"
          ? "Activation was denied by Firestore permissions."
          : error.message || "Unable to activate course."
      );

    } finally {
      unlockButton.disabled = false;
    }

  });
}
