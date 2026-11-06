
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
  getDocs,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ========================================
// COURSE CATALOG — JSON
// ========================================

async function loadCourseCatalog() {
  const response = await fetch(
    "/json/course_catalog.json",
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Unable to load course catalog.");
  }

  const catalog = await response.json();

  if (
    !catalog ||
    typeof catalog !== "object" ||
    Array.isArray(catalog)
  ) {
    throw new Error("Invalid course catalog format.");
  }

  return catalog;
}


// Convert short code (M2D) into course ID.
async function getCourseId(shortCode) {
  const catalog = await loadCourseCatalog();

  const normalizedCode = shortCode.trim().toUpperCase();

  const matches = Object.entries(catalog).filter(
    ([courseId, course]) =>
      course &&
      typeof course.courseCode === "string" &&
      course.courseCode.trim().toUpperCase() === normalizedCode
  );

  if (!matches.length) {
    throw new Error("Invalid course code.");
  }

  if (matches.length > 1) {
    throw new Error("Duplicate course code in catalog.");
  }

  return matches[0][0];
}


// ========================================
// COURSE CARDS
// ========================================

const container =
  document.getElementById("courses-container");

function showMessage(message) {
  if (!container) return;

  container.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  container.appendChild(paragraph);
}


// Make Firestore group IDs readable.
function readableGroupName(groupId) {
  return groupId
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}


// Get groups from Firestore.
// Called for administrator accounts only.
async function loadGroups(courseId) {
  const groupsRef = collection(
    db,
    "activationCodes",
    courseId,
    "groups"
  );

  const snapshot = await getDocs(groupsRef);

  return snapshot.docs.map(groupDoc => {
    const data = groupDoc.data();

    return {
      id: groupDoc.id,
      name:
        typeof data.name === "string" &&
        data.name.trim()
          ? data.name
          : readableGroupName(groupDoc.id)
    };
  });
}


// Build a course card.
// Admin cards include a specific group in the URL.
function appendCourseCard(courseId, course, group = null) {
  if (!container) return;

  if (
    !course ||
    typeof course.page !== "string" ||
    !course.page.startsWith("/courses/")
  ) {
    console.warn("Invalid course page:", courseId);
    return;
  }

  const link = document.createElement("a");
  link.className = "course-card";

  const url = new URL(
    course.page,
    window.location.origin
  );

  if (group) {
    url.searchParams.set("previewGroup", group.id);
    url.searchParams.set("previewCourse", courseId);

    link.classList.add("admin-preview-card");
  }

  link.href = url.pathname + url.search;

  // Course image
  const image = document.createElement("img");

  image.className = "course-image";
  image.src =
    typeof course.image === "string"
      ? course.image
      : "";

  image.alt = course.title || "Course thumbnail";
  image.loading = "lazy";

  // Course information
  const info = document.createElement("div");
  info.className = "course-info";

  const title = document.createElement("p");
  title.textContent = course.title || courseId;

  info.appendChild(title);

  // Extra information for admin preview cards.
  if (group) {
    const groupName = document.createElement("span");

    groupName.className = "admin-group-badge";
    groupName.textContent = group.name;

    const adminLabel = document.createElement("span");

    adminLabel.className = "admin-preview-label";
    adminLabel.textContent = "ADMIN PREVIEW";

    info.appendChild(groupName);
    info.appendChild(adminLabel);
  }

  link.appendChild(image);
  link.appendChild(info);

  container.appendChild(link);
}


// ========================================
// LOAD STUDENT / ADMIN COURSES
// ========================================

async function loadStudentCourses(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    showMessage("Student profile not found.");
    return;
  }

  const student = snapshot.data();

  const catalog = await loadCourseCatalog();

  if (!container) return;

  container.replaceChildren();

  if (student.role === "admin") {

    // Administrators see one course card per group.
    for (const [courseId, course] of Object.entries(catalog)) {

      if (!course || typeof course.page !== "string") {
        continue;
      }

      try {
        const groups = await loadGroups(courseId);

        for (const group of groups) {
          appendCourseCard(courseId, course, group);
        }

      } catch (error) {
        console.warn(
          "Unable to list groups for:",
          courseId,
          error
        );
      }
    }

    if (!container.children.length) {
      showMessage(
        "No course groups available for admin preview. " +
        "Check your Firestore groups and admin permissions."
      );
    }

  } else {

    // Students see only their purchased courses.
    const purchasedCourses = Array.isArray(
      student.purchasedCourses
    )
      ? student.purchasedCourses
      : [];

    purchasedCourses.forEach(courseId => {
      appendCourseCard(
        courseId,
        catalog[courseId]
      );
    });

    if (!container.children.length) {
      showMessage(
        "You don't have any courses assigned yet."
      );
    }
  }
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
    console.error(
      "Device verification failed:",
      error
    );

    showMessage(
      error.message === "DEVICE_LIMIT_REACHED"
        ? "This account already has two registered browsers. " +
          "Contact iArtSociety to reset a device."
        : "Unable to verify this browser. Please try again."
    );

    return;
  }

  try {
    await loadStudentCourses(user);

  } catch (error) {
    console.error(
      "Course loading error:",
      error
    );

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


// Automatically uppercase both input fields.
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

      // Resolve course ID from the JSON catalog.
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

      // Firestore transaction ensures atomic redemption.
      await runTransaction(db, async transaction => {

        // All reads must occur before writes.
        const lookupSnap =
          await transaction.get(lookupRef);

        if (!lookupSnap.exists()) {
          throw new Error("Invalid activation code.");
        }

        const lookup = lookupSnap.data();


alert(
  "Activation Debug\n\n" +
  "Entered Course Code: " + shortCode + "\n" +
  "Activation Code: " + code + "\n" +
  "Resolved Course ID: " + courseId + "\n" +
  "Firestore Data: " +
  JSON.stringify(lookup, null, 2)
);


        if (lookup.courseId !== courseId) {
          throw new Error(
            "This activation code belongs to another course."
          );
        }

        // Support old groupID and correct groupId fields.
        const groupId =
          lookup.groupId ?? lookup.groupID;

        if (
          typeof groupId !== "string" ||
          !/^[A-Za-z0-9_-]+$/.test(groupId)
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
        )
          ? student.purchasedCourses
          : [];

        const currentCodes = Array.isArray(
          student.redeemedCodes
        )
          ? student.redeemedCodes
          : [];

        const currentGroups =
          student.courseGroups &&
          typeof student.courseGroups === "object" &&
          !Array.isArray(student.courseGroups)
            ? student.courseGroups
            : {};

        // Only one enrollment per course for students.
        // Admin previews do not consume activation codes.
        if (currentCourses.includes(courseId)) {
          throw new Error(
            "You already have access to this course."
          );
        }

        const redemptionRecord =
          `${courseId}:${groupId}:${code}`;

        // Update student account.
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

        // Mark activation code as redeemed.
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
