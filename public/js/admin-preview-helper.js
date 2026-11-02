
import { auth, db } from "/js/firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  requireRegisteredDevice
} from "/js/device-guard.js";


// ========================================
// RESOLVE COURSE RESOURCE JSON
// ========================================

export async function resolveCourseResource(courseId) {

  // Wait until Firebase restores the login session.
  await auth.authStateReady();

  const user = auth.currentUser;

  if (!user) {
    throw new Error("SIGN_IN_REQUIRED");
  }

  // Verify that this browser is registered.
  await requireRegisteredDevice(user);

  // Read the student's Firestore account.
  const userRef = doc(
    db,
    "users",
    user.uid
  );

  const studentSnap = await getDoc(userRef);

  if (!studentSnap.exists()) {
    throw new Error("Student profile not found.");
  }

  const student = studentSnap.data();

  const isAdmin = student.role === "admin";

  // Read admin preview parameters from the URL.
  const params = new URLSearchParams(
    window.location.search
  );

  const previewGroup = params.get("previewGroup");
  const previewCourse = params.get("previewCourse");

  // Regular students cannot request admin previews.
  if (previewGroup && !isAdmin) {
    throw new Error("ADMIN_PREVIEW_NOT_ALLOWED");
  }

  // Prevent using a group link for another course.
  if (
    previewGroup &&
    previewCourse !== courseId
  ) {
    throw new Error("PREVIEW_COURSE_MISMATCH");
  }

  let groupId;

  if (isAdmin && previewGroup) {

    // Administrator selects the group using a course card.
    groupId = previewGroup;

  } else {

    // Student must actually own this course.
    if (
      !student.purchasedCourses?.includes(courseId)
    ) {
      throw new Error("COURSE_NOT_ENROLLED");
    }

    // Students use their assigned group.
    groupId = student.courseGroups?.[courseId];
  }

  if (
    !groupId ||
    !/^[A-Za-z0-9_-]+$/.test(groupId)
  ) {
    throw new Error("INVALID_GROUP");
  }

  // Read the selected group's Firestore configuration.
  const groupRef = doc(
    db,
    "activationCodes",
    courseId,
    "groups",
    groupId
  );

  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) {
    throw new Error("GROUP_NOT_FOUND");
  }

  const resourceConfig =
    groupSnap.data().resourceConfig;

  if (
    typeof resourceConfig !== "string" ||
    !resourceConfig.startsWith("/json/courses/")
  ) {
    throw new Error("INVALID_RESOURCE_CONFIG");
  }

  return {
    user,
    isAdmin,
    groupId,
    resourceConfig
  };
}
