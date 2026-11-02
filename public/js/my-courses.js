
import { auth, db } from "/js/firebase-config.js";

import {
  requireRegisteredDevice
} from "/js/device-guard.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ========================================
// COURSE METADATA FROM FIRESTORE
// ========================================

// Convert M2D into meenakshi-2d-tanjore
async function getCourseId(shortCode) {
  const coursesRef = collection(db, "courses");

  const q = query(
    coursesRef,
    where("courseCode", "==", shortCode.trim().toUpperCase())
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid course code.");
  }

  if (snapshot.size !== 1) {
    throw new Error("Duplicate course code configuration.");
  }

  return snapshot.docs[0].id;
}


// Read course title, image and page from Firestore.
async function loadCourseCatalog(courseIds) {
  const entries = await Promise.all(
    courseIds.map(async courseId => {
      const courseRef = doc(db, "courses", courseId);
      const snapshot = await getDoc(courseRef);

      if (!snapshot.exists()) {
        console.warn("Course metadata missing:", courseId);
        return null;
      }

      return [courseId, snapshot.data()];
    })
  );

  return Object.fromEntries(
    entries.filter(entry => entry !== null)
  );
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

    if (
      typeof course.page !== "string" ||
      !course.page.startsWith("/courses/")
    ) {
      console.warn("Invalid course page:", courseId);
      return;
    }

    const link = document.createElement("a");
    link.className = "course-card";
    link.href = course.page;

    const image = document.createElement("img");
    image.src = course.image || "";
    image.alt = course.title || "Course thumbnail";
    image.className = "course-image";

    const info = document.createElement("div");
    info.className = "course-info";

    const title = document.createElement("p");
    title.textContent = course.title || courseId;

    info.appendChild(title);
    link.appendChild(image);
    link.appendChild(info);
    container.appendChild(link);
  });

  if (!container.children.length) {
    showMessage(
      "Your assigned courses aren't available in Firestore yet."
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
    ? await loadCourseCatalog(courseIds)
    : {};

  displayCourses(courseIds, catalog);
}


// ========================================
// AUTHENTICATION AND DEVICE CHECK
// ========================================

showMessage("Loading your courses...");

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  try {
    await requireRegisteredDevice(user);
  } catch (error) {
    console.error("Device verification failed:", error);

    if (error.message === "DEVICE_LIMIT_REACHED") {
      alert(
        "This iArtSociety account already has " +
        "two registered devices.\n\n" +
        "Please contact iArtSociety to reset a device."
      );
    } else {
      alert(
        "Unable to verify this device. " +
        "Please check your internet connection."
      );
    }

    window.location.replace("/index.html");
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


// Automatically uppercase both activation inputs.
function enableUppercaseCodeInput(input) {
  if (!input) return;

  input.autocapitalize = "characters";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.style.textTransform = "uppercase";

  input.addEventListener("input", () => {
    const start = input.selectionStart;
    const end = input.selectionEnd;

    input.value = input.value.toUpperCase();

    if (start !== null && end !== null) {
      input.setSelectionRange(start, end);
    }
  });
}

enableUppercaseCodeInput(shortCodeInput);
enableUppercaseCodeInput(codeInput);


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

      // Resolve short course code using Firestore.
      const courseId = await getCourseId(shortCode);

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const lookupRef = doc(
        db,
        "activationCodeLookup",
        code
      );

      // Redeem atomically.
      await runTransaction(db, async transaction => {

        // All reads must happen before any writes.
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

        const codeRef = doc(
          db,
          "activationCodes",
          courseId,
          "groups",
          groupId,
          "codes",
          code
        );

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