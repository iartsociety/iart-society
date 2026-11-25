
import { auth, db } from "/js/firebase-config.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ========================================
// ELEMENTS
// ========================================

const loadingStatus =
  document.getElementById("loading-status");

const accessDenied =
  document.getElementById("access-denied");

const adminApp =
  document.getElementById("admin-app");

const adminWelcome =
  document.getElementById("admin-welcome");

const searchForm =
  document.getElementById("student-search-form");

const searchInput =
  document.getElementById("student-search");

const searchButton =
  document.getElementById("search-button");

const searchStatus =
  document.getElementById("search-status");

const resultsContainer =
  document.getElementById("student-results");

let adminReady = false;

// ========================================
// HELPERS
// ========================================

function setStatus(message) {
  searchStatus.textContent = message;
}

function createTextElement(tag, text) {
  const element = document.createElement(tag);
  element.textContent = String(text ?? "");
  return element;
}

function formatDate(value) {
  if (!value) return "Not set";

  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// ========================================
// VERIFY ADMINISTRATOR
// ========================================

async function initializeAdmin() {
  try {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
      window.location.replace("/login.html");
      return;
    }

    const profileSnap = await getDoc(
      doc(db, "users", user.uid)
    );

    if (
      !profileSnap.exists() ||
      profileSnap.data().role !== "admin"
    ) {
      loadingStatus.style.display = "none";
      accessDenied.style.display = "block";
      return;
    }

    adminReady = true;

    adminWelcome.textContent =
      "Signed in as " + (user.email || "Administrator");

    loadingStatus.style.display = "none";
    adminApp.style.display = "block";

  } catch (error) {
    console.error("Admin initialization:", error);

    loadingStatus.textContent =
      "Unable to verify administrator access. " +
      (error.message || "Please try again.");
  }
}

// ========================================
// DISPLAY STUDENT
// ========================================

function showStudent(studentId, student) {
  const card = document.createElement("div");
  card.className = "student-result";

  card.appendChild(
    createTextElement(
      "h3",
      student.name || "Unnamed student"
    )
  );

  card.appendChild(
    createTextElement(
      "p",
      "Email: " + (student.email || "Not available")
    )
  );

  card.appendChild(
    createTextElement("p", "UID: " + studentId)
  );

  card.appendChild(
    createTextElement(
      "p",
      "Role: " + (student.role || "member")
    )
  );

  const purchasedCourses = Array.isArray(
    student.purchasedCourses
  )
    ? student.purchasedCourses
    : [];

  const courseGroups = student.courseGroups || {};

  const courseExpirations =
    student.courseExpirations || {};

  const heading = createTextElement(
    "h4",
    "Enrolled Courses"
  );

  card.appendChild(heading);

  if (purchasedCourses.length === 0) {
    card.appendChild(
      createTextElement("p", "No courses enrolled.")
    );
  }

  for (const courseId of purchasedCourses) {
    const courseBox = document.createElement("div");

    courseBox.style.padding = "12px";
    courseBox.style.marginBottom = "10px";
    courseBox.style.background = "#28383e";
    courseBox.style.borderRadius = "8px";

    courseBox.appendChild(
      createTextElement("strong", courseId)
    );

    courseBox.appendChild(
      createTextElement(
        "p",
        "Group: " +
        (courseGroups[courseId] || "Not assigned")
      )
    );

    courseBox.appendChild(
      createTextElement(
        "p",
        "Expires: " +
        formatDate(courseExpirations[courseId])
      )
    );

    card.appendChild(courseBox);
  }

  const redeemedCodes = Array.isArray(
    student.redeemedCodes
  )
    ? student.redeemedCodes
    : [];

  if (redeemedCodes.length > 0) {
    card.appendChild(
      createTextElement(
        "h4",
        "Redeemed Activation Codes"
      )
    );

    for (const code of redeemedCodes) {
      card.appendChild(
        createTextElement("p", code)
      );
    }
  }

  resultsContainer.appendChild(card);
}

// ========================================
// STUDENT SEARCH
// ========================================

async function searchStudents(searchTerm) {
  if (!adminReady) {
    throw new Error("Administrator access required.");
  }

  const usersRef = collection(db, "users");

  const term = searchTerm.trim();

  if (!term) {
    throw new Error("Enter a student name or email.");
  }

  let searchQuery;

  if (term.includes("@")) {
    // Exact email match.
    searchQuery = query(
      usersRef,
      where("email", "==", term),
      limit(20)
    );

  } else {
    // Case-sensitive name prefix search.
    searchQuery = query(
      usersRef,
      where("name", ">=", term),
      where("name", "<=", term + "\uf8ff"),
      limit(20)
    );
  }

  const snapshot = await getDocs(searchQuery);

  resultsContainer.replaceChildren();

  if (snapshot.empty) {
    setStatus("No matching students found.");
    return;
  }

  setStatus(
    snapshot.size + " matching account(s) found."
  );

  snapshot.forEach(studentDoc => {
    showStudent(
      studentDoc.id,
      studentDoc.data()
    );
  });
}

// ========================================
// SEARCH FORM
// ========================================

searchForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const term = searchInput.value.trim();

    if (!term) return;

    searchButton.disabled = true;
    setStatus("Searching Firebase...");
    resultsContainer.replaceChildren();

    try {
      await searchStudents(term);
    } catch (error) {
      console.error("Student search:", error);

      setStatus(
        "Search failed: " +
        (error.message || "Unknown error")
      );
    } finally {
      searchButton.disabled = false;
    }
  }
);

// ========================================
// START
// ========================================

initializeAdmin();
