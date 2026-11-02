
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
  getDocs,
  collection,
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

async function getCourseId(shortCode) {
  const catalog = await loadCourseCatalog();

  const normalizedCode = shortCode.trim().toUpperCase();

  const matches = Object.entries(catalog).filter(
    ([courseId, course]) =>
      course &&
      typeof course.courseCode === "string" &&
      course.courseCode.trim().toUpperCase() === normalizedCode
  );

  if (matches.length === 0) {
    throw new Error("Invalid course code.");
  }

  if (matches.length > 1) {
    throw new Error(
      "Multiple courses use this course code. Contact iArtSociety."
    );
  }

  return matches[0][0];
}


// ========================================
// DISPLAY COURSES
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

async function getAdminCourseGroups(courseId) {
  try {
    const groupsRef = collection(
      db,
      "activationCodes",
      courseId,
      "groups"
    );

    const snapshot = await getDocs(groupsRef);

    return snapshot.docs.map(groupDoc => ({
      id: groupDoc.id,
      name: groupDoc.data().name ||
        groupDoc.id
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, letter => letter.toUpperCase())
    }));
  } catch (error) {
    console.warn(
      "Unable to load admin groups:",
      courseId,
      error
    );
    return [];
  }
}


function displayCourses(courseIds, catalog, isAdmin = false) {
  if (!container) return;

  container.textContent = "";

  if (!courseIds.length) {
    showMessage(
      isAdmin
        ? "No courses are available in the catalog."
        : "You don't have any courses assigned yet."
    );
    return;
  }

  courseIds.forEach(courseId => {
    const course = catalog[courseId];

    if (!course) {
      console.warn("Course missing from catalog:", courseId);
      return;
    }

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
    image.src =
      typeof course.image === "string"
        ? course.image
        : "";

    image.alt = course.title || "Course thumbnail";
    image.className = "course-image";
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "course-info";

    const title = document.createElement("p");
    title.textContent = course.title || courseId;

    info.appendChild(title);

    // Visual label for administrator course cards.
    
  if (isAdmin) {
    link.classList.add("admin-preview-card");

    const label = document.createElement("span");
    label.className = "admin-preview-label";
    label.textContent = "ADMIN PREVIEW";
    info.appendChild(label);

    const groupsContainer = document.createElement("div");
    groupsContainer.className = "admin-course-groups";

    getAdminCourseGroups(courseId).then(groups => {
      groupsContainer.replaceChildren();

      groups.forEach(group => {
        const badge = document.createElement("span");
        badge.className = "admin-group-badge";
        badge.textContent = group.name;
        groupsContainer.appendChild(badge);
      });

      if (!groups.length) {
        groupsContainer.textContent =
          "No groups available or group access restricted";
      }
  });

  info.appendChild(groupsContainer);
}


    link.appendChild(image);
    link.appendChild(info);

    container.appendChild(link);
  });

  if (!container.children.length) {
    showMessage(
      "Your courses aren't available in the course catalog."
    );
  }
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

  const isAdmin = student.role === "admin";

  const purchasedCourses = Array.isArray(
    student.purchasedCourses
  )
    ? student.purchasedCourses
    : [];

  const catalog = await loadCourseCatalog();

  // Administrators see every catalog entry.
  // Students see only their purchased courses.
  const courseIds = isAdmin
    ? Object.keys(catalog)
    : purchasedCourses;

  displayCourses(courseIds, catalog, isAdmin);
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

    // Do not display courses on an unverified device.
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
      // Resolve course ID from JSON catalog.
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

      await runTransaction(db, async transaction => {

        // All transaction reads happen before writes.
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

        // Support both groupId and older groupID records.
        const groupId = lookup.groupId ?? lookup.groupID;

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

        // One course enrollment per student.
        // Admin preview does not require redemption.
        if (currentCourses.includes(courseId)) {
          throw new Error(
            "You already have access to this course."
          );
        }

        const redemptionRecord =
          `${courseId}:${groupId}:${code}`;

        // Preserve other courses and learning groups.
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

        // Mark activation code as used.
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
