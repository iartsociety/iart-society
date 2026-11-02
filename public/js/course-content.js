
import { auth, db } from "/js/firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  resolveCourseResource
} from "/js/admin-preview-helper.js";


// ========================================
// COURSE CONTENT
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

  const fallbackConfigPath =
    document.body.dataset.courseConfig;

  const titleElement =
    document.getElementById("course-title");

  const thumbnailElement =
    document.getElementById("course-thumbnail");

  const documentsContainer =
    document.getElementById("course-documents");

  const videosContainer =
    document.getElementById("course-videos");

  const imagesContainer =
    document.getElementById("course-images");

  const lightbox =
    document.getElementById("lightbox");

  const lightboxImg =
    document.getElementById("lightbox-img");

  const closeButton =
    document.getElementById("close-lightbox");

  const prevButton =
    document.getElementById("prev-image");

  const nextButton =
    document.getElementById("next-image");

  const counter =
    document.getElementById("image-counter");

  let currentImages = [];
  let currentIndex = 0;


  // ========================================
  // STATUS MESSAGES
  // ========================================

  function showError(message) {
    console.error(message);

    if (titleElement) {
      titleElement.textContent = message;
    }
  }


  // ========================================
  // COURSE CATALOG
  // ========================================

  async function loadCatalog() {
    const response = await fetch(
      "/json/course_catalog.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Unable to load course catalog.");
    }

    return await response.json();
  }


  // ========================================
  // IDENTIFY COURSE
  // ========================================

  async function identifyCourse(user, catalog) {

    const params = new URLSearchParams(
      window.location.search
    );

    const previewCourse =
      params.get("previewCourse");

    const previewGroup =
      params.get("previewGroup");

    const currentPage =
      window.location.pathname;

    // Find all catalog courses using this HTML page.
    const matchingCourses = Object.entries(catalog)
      .filter(([courseId, course]) => {
        if (typeof course.page !== "string") {
          return false;
        }

        try {
          const pageUrl = new URL(
            course.page,
            window.location.origin
          );

          return pageUrl.pathname === currentPage;

        } catch {
          return false;
        }
      })
      .map(([courseId]) => courseId);


    // ADMIN PREVIEW
    // The helper will verify admin permissions.
    if (previewCourse || previewGroup) {

      if (
        !previewCourse ||
        !previewGroup ||
        !matchingCourses.includes(previewCourse)
      ) {
        throw new Error(
          "Invalid administrator preview link."
        );
      }

      return {
        courseId: previewCourse,
        isPreview: true
      };
    }


    // NORMAL STUDENT COURSE
    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("Student profile not found.");
    }

    const student = userSnap.data();

    const purchasedCourses = Array.isArray(
      student.purchasedCourses
    )
      ? student.purchasedCourses
      : [];

    const courseGroups =
      student.courseGroups || {};


    // Prefer the course that has a group assignment.
    // This helps when older and newer course IDs
    // share the same HTML page.
    const groupedCourse = matchingCourses.find(
      courseId =>
        purchasedCourses.includes(courseId) &&
        typeof courseGroups[courseId] === "string"
    );

    if (groupedCourse) {
      return {
        courseId: groupedCourse,
        isPreview: false
      };
    }


    // Support older purchased course IDs.
    const legacyCourse = matchingCourses.find(
      courseId => purchasedCourses.includes(courseId)
    );

    if (legacyCourse) {
      return {
        courseId: legacyCourse,
        isPreview: false
      };
    }


    // An admin must select a specific preview card.
    if (student.role === "admin") {
      throw new Error(
        "Select a learning-group card from My Courses."
      );
    }

    throw new Error(
      "You do not have access to this course."
    );
  }


  // ========================================
  // DOCUMENTS
  // ========================================

  function loadDocuments(documents = []) {
    if (!documentsContainer) return;

    documentsContainer.replaceChildren();

    for (const documentInfo of documents) {

      const wrapper =
        document.createElement("div");

      const heading =
        document.createElement("h3");

      heading.textContent = documentInfo.title;

      const iframe =
        document.createElement("iframe");

      iframe.src = documentInfo.path;
      iframe.title = documentInfo.title;
      iframe.className = "pdf-viewer";
      iframe.loading = "lazy";


      const download =
        document.createElement("p");

      download.className = "pdf-download";

      const link =
        document.createElement("a");

      link.href = documentInfo.path;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open PDF in New Tab";

      download.appendChild(link);

      wrapper.append(
        heading,
        iframe,
        download
      );

      documentsContainer.appendChild(wrapper);
    }

    if (!documents.length) {
      documentsContainer.textContent =
        "No documents available yet.";
    }
  }


  // ========================================
  // VIMEO / VIDEO LESSONS
  // ========================================

  function loadVideos(videos = []) {
    if (!videosContainer) return;

    videosContainer.replaceChildren();

    for (const video of videos) {

      const wrapper =
        document.createElement("div");

      wrapper.className = "video-lesson";

      const heading =
        document.createElement("h3");

      heading.textContent = video.title;

      const iframe =
        document.createElement("iframe");

      iframe.src = video.url;
      iframe.title = video.title;
      iframe.loading = "lazy";

      iframe.allow =
        "autoplay; fullscreen; picture-in-picture; encrypted-media";

      iframe.allowFullscreen = true;

      iframe.referrerPolicy =
        "strict-origin-when-cross-origin";

      iframe.setAttribute("frameborder", "0");

      // Optional portrait video support.
      if (video.aspectRatio === "9/16") {
        iframe.classList.add("video-portrait");
      }

      wrapper.append(heading, iframe);

      videosContainer.appendChild(wrapper);
    }

    if (!videos.length) {
      videosContainer.textContent =
        "Videos coming soon.";
    }
  }


  // ========================================
  // IMAGE GALLERY
  // ========================================

  async function loadImages(manifestPath) {
    if (!imagesContainer) return;

    imagesContainer.textContent =
      "Loading images...";

    if (!manifestPath) {
      imagesContainer.textContent =
        "No images available yet.";
      return;
    }

    const response = await fetch(
      manifestPath,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        "Image manifest could not be loaded."
      );
    }

    const categories = await response.json();

    imagesContainer.replaceChildren();

    for (const [categoryName, imagePaths]
      of Object.entries(categories)) {

      if (
        !Array.isArray(imagePaths) ||
        !imagePaths.length
      ) {
        continue;
      }

      const section =
        document.createElement("section");

      section.className = "gallery-category";

      const heading =
        document.createElement("h3");

      heading.textContent = categoryName
        .replace(/[_-]/g, " ");

      const row =
        document.createElement("div");

      row.className = "horizontal-gallery";

      imagePaths.forEach((path, index) => {

        const img =
          document.createElement("img");

        img.src = path;

        img.alt =
          `${categoryName} image ${index + 1}`;

        img.loading = "lazy";
        img.tabIndex = 0;

        img.setAttribute("role", "button");

        row.appendChild(img);
      });

      section.append(heading, row);

      imagesContainer.appendChild(section);
    }

    if (!imagesContainer.children.length) {
      imagesContainer.textContent =
        "No images available yet.";
    }
  }


  // ========================================
  // IMAGE LIGHTBOX
  // ========================================

  function showImage() {
    if (
      !currentImages.length ||
      !lightboxImg ||
      !counter
    ) {
      return;
    }

    lightboxImg.src =
      currentImages[currentIndex].src;

    lightboxImg.alt =
      currentImages[currentIndex].alt;

    counter.textContent =
      `${currentIndex + 1} / ${currentImages.length}`;
  }


  function openLightbox(image) {

    const row = image.closest(
      ".horizontal-gallery"
    );

    if (!row || !lightbox) return;

    currentImages = Array.from(
      row.querySelectorAll("img")
    );

    currentIndex =
      currentImages.indexOf(image);

    if (currentIndex < 0) return;

    showImage();

    lightbox.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    closeButton.focus();
  }


  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;

    lightbox.classList.add("hidden");

    lightboxImg.removeAttribute("src");

    document.body.style.overflow = "";
  }


  function moveImage(direction) {
    if (!currentImages.length) return;

    currentIndex =
      (currentIndex + direction + currentImages.length)
      % currentImages.length;

    showImage();
  }


  if (
    lightbox &&
    lightboxImg &&
    closeButton &&
    prevButton &&
    nextButton &&
    counter &&
    imagesContainer
  ) {

    imagesContainer.addEventListener(
      "click",
      event => {

        if (
          event.target.matches(
            ".horizontal-gallery img"
          )
        ) {
          openLightbox(event.target);
        }
      }
    );


    imagesContainer.addEventListener(
      "keydown",
      event => {

        if (
          event.target.matches(
            ".horizontal-gallery img"
          ) &&
          (
            event.key === "Enter" ||
            event.key === " "
          )
        ) {
          event.preventDefault();

          openLightbox(event.target);
        }
      }
    );


    prevButton.addEventListener(
      "click",
      () => moveImage(-1)
    );

    nextButton.addEventListener(
      "click",
      () => moveImage(1)
    );

    closeButton.addEventListener(
      "click",
      closeLightbox
    );

    lightbox.addEventListener(
      "click",
      event => {
        if (event.target === lightbox) {
          closeLightbox();
        }
      }
    );

    document.addEventListener(
      "keydown",
      event => {

        if (lightbox.classList.contains("hidden")) {
          return;
        }

        if (event.key === "Escape") {
          closeLightbox();
        }

        if (event.key === "ArrowLeft") {
          moveImage(-1);
        }

        if (event.key === "ArrowRight") {
          moveImage(1);
        }
      }
    );
  }


  // ========================================
  // LOAD THE CORRECT COURSE VERSION
  // ========================================

  try {

    // Wait for Google/Firebase authentication.
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
      window.location.replace("/login.html");
      return;
    }


    // Identify the course from the JSON catalog
    // and the student's enrollment or preview link.
    const catalog = await loadCatalog();

    const {
      courseId,
      isPreview
    } = await identifyCourse(user, catalog);


    // Resolve the exact Firestore learning group.
    // This also verifies device registration
    // and administrator preview permissions.
    const {
      resourceConfig,
      groupId,
      isAdmin
    } = await resolveCourseResource(courseId);


    console.log("iArtSociety course:", {
      courseId,
      groupId,
      isAdmin,
      isPreview,
      resourceConfig
    });


    // Fetch the selected group's resource JSON.
    const response = await fetch(
      resourceConfig,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        "Unable to load course resource JSON: " +
        resourceConfig
      );
    }

    const course = await response.json();


    // ========================================
    // RENDER COURSE
    // ========================================

    if (titleElement) {
      titleElement.textContent =
        course.title ||
        catalog[courseId]?.title ||
        courseId;
    }

    if (thumbnailElement) {
      thumbnailElement.src =
        course.thumbnail ||
        catalog[courseId]?.image ||
        "";
    }


    // Optional admin preview information.
    if (isAdmin && isPreview && titleElement) {

      const previewLabel =
        document.createElement("div");

      previewLabel.className =
        "course-admin-preview-label";

      previewLabel.textContent =
        `ADMIN PREVIEW — ${groupId}`;

      titleElement.insertAdjacentElement(
        "afterend",
        previewLabel
      );
    }


    loadDocuments(course.documents || []);

    loadVideos(course.videos || []);


    try {
      await loadImages(
        course.images?.manifest
      );

    } catch (error) {

      console.error(
        "Image gallery error:",
        error
      );

      if (imagesContainer) {
        imagesContainer.textContent =
          "Unable to load images.";
      }
    }


  } catch (error) {

    console.error(
      "Course loading error:",
      error
    );

    if (error.message === "SIGN_IN_REQUIRED") {
      window.location.replace("/login.html");
      return;
    }

    if (error.message === "DEVICE_LIMIT_REACHED") {
      showError(
        "This account already has two registered devices."
      );
      return;
    }

    if (error.message === "ADMIN_PREVIEW_NOT_ALLOWED") {
      showError(
        "Administrator preview is not available for this account."
      );
      return;
    }

    if (error.message === "COURSE_NOT_ENROLLED") {
      showError(
        "You do not have access to this course."
      );
      return;
    }

    showError(
      "Unable to load course. " +
      (error.message || "")
    );
  }

});
