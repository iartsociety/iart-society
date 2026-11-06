
// ========================================
// iArtSociety Course Expiration Helper
// ========================================

const COURSE_TIME_ZONE = "America/Chicago";

// Read the expiration timestamp for one course.
export function getCourseExpiration(student, courseId) {
  const expirations = student.courseExpirations || {};
  const value = expirations[courseId];

  if (value == null) {
    return null;
  }

  if (typeof value.toDate !== "function") {
    throw new Error(
      "Invalid expiration timestamp for " + courseId
    );
  }

  const date = value.toDate();

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "Invalid expiration date for " + courseId
    );
  }

  return date;
}

// True when the expiration instant has passed.
export function isCourseExpired(expiresAt) {
  return expiresAt instanceof Date &&
    Date.now() >= expiresAt.getTime();
}

// Show the final calendar day of access.
export function formatCourseExpiration(expiresAt) {
  if (!expiresAt) return "";

  // Expiration is exclusive, so subtract one
  // millisecond to find the last valid day.
  const finalDay = new Date(
    expiresAt.getTime() - 1
  );

  return new Intl.DateTimeFormat("en-US", {
    timeZone: COURSE_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(finalDay);
}

// Reusable label for cards and course pages.
export function createExpirationLabel(expiresAt) {
  const label = document.createElement("div");
  label.className = "course-expiration";

  if (isCourseExpired(expiresAt)) {
    label.classList.add("course-expired");
    label.textContent = "Access Expired";
  } else {
    label.textContent =
      "Access until " +
      formatCourseExpiration(expiresAt);
  }

  return label;
}
