console.log("JS is connected");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // COURSE DATABASE
  // =========================

  const courseCodes = {
    "DWHG26": {
      id: "diya-wall-hanging",
      title: "Diya Wall Hanging Guide",
      page: "diya.html",
      image: "diya-course.png"
    },
     "LL0526": {
      id: "lotus-lippan-art",
      title: "Lotus Lippan Art",
      page: "lotus.html",
      image: "lotus-course.jpg"
    }
  };

  // =========================
  // ELEMENTS
  // =========================

  const addButton =
    document.getElementById("add-course-btn");

  const popup =
    document.getElementById("course-popup");

  const closeButton =
    document.getElementById("close-popup-btn");

  const submitButton =
    document.getElementById("submit-code-btn");

  const input =
    document.getElementById("course-code-input");

  const coursesContainer =
    document.getElementById("courses-container");

  // =========================
  // SAFETY CHECK
  // =========================

  console.log(addButton);
  console.log(popup);

  // =========================
  // LOAD SAVED COURSES
  // =========================

  let myCourses;

  try {

    myCourses =
      JSON.parse(
        localStorage.getItem("myCourses")
      ) || [];

    if (!Array.isArray(myCourses)) {
      myCourses = [];
    }

  } catch {

    myCourses = [];

  }

  // =========================
  // SAVE COURSES
  // =========================

  function saveCourses() {

    localStorage.setItem(
      "myCourses",
      JSON.stringify(myCourses)
    );

  }

  // =========================
  // RENDER COURSES
  // =========================

  function renderCourses() {

    if (!coursesContainer) return;

    coursesContainer.innerHTML = "";

    myCourses.forEach(courseId => {

      const course =
        Object.values(courseCodes)
          .find(c => c.id === courseId);

      if (!course) return;

      const link =
        document.createElement("a");

      link.className = "course-card";

      link.href = course.page;

      link.innerHTML = `
        <img
          src="${course.image}"
          alt="${course.title}"
          class="course-image"
        >

        <div class="course-info">
          <p>${course.title}</p>
        </div>
      `;

      coursesContainer.appendChild(link);

    });

  }

  // =========================
  // OPEN POPUP
  // =========================

  if (addButton && popup) {

    addButton.addEventListener("click", () => {

      console.log("PLUS BUTTON CLICKED");

      popup.classList.remove("hidden");

    });

  }

  // =========================
  // CLOSE POPUP BUTTON
  // =========================

  if (closeButton && popup) {

    closeButton.addEventListener("click", () => {

      popup.classList.add("hidden");

    });

  }

  // =========================
  // CLICK OUTSIDE POPUP
  // =========================

  if (popup) {

    popup.addEventListener("click", (event) => {

      if (event.target === popup) {

        popup.classList.add("hidden");

      }

    });

  }

  // =========================
  // SUBMIT COURSE CODE
  // =========================

  if (submitButton && input && popup) {

    submitButton.addEventListener("click", () => {

      const enteredCode =
        input.value.trim().toUpperCase();

      const course =
        courseCodes[enteredCode];

      // INVALID CODE
      if (!course) {

        alert("Invalid Course Code");

        return;

      }

      // ALREADY ADDED
      const alreadyUnlocked =
        myCourses.includes(course.id);

      if (alreadyUnlocked) {

        alert("Course already added.");

        return;

      }

      // SAVE COURSE
      myCourses.push(course.id);

      saveCourses();

      renderCourses();

      // RESET POPUP
      popup.classList.add("hidden");

      input.value = "";

      alert("Course Added!");

    });

  }

// =========================
// IMAGE LIGHTBOX
// =========================

const galleryImages =
  document.querySelectorAll(".horizontal-gallery img");

const lightbox =
  document.getElementById("lightbox");

const lightboxImg =
  document.getElementById("lightbox-img");

const closeLightbox =
  document.getElementById("close-lightbox");

// ONLY RUN IF LIGHTBOX EXISTS
if (
  galleryImages.length > 0 &&
  lightbox &&
  lightboxImg &&
  closeLightbox
) {

  // OPEN IMAGE
  galleryImages.forEach(image => {

    image.addEventListener("click", () => {

      lightboxImg.src = image.src;

      lightbox.classList.remove("hidden");

    });

  });

  // CLOSE BUTTON
  closeLightbox.addEventListener("click", () => {

    lightbox.classList.add("hidden");

  });

  // CLICK BACKGROUND
  lightbox.addEventListener("click", (event) => {

    if (event.target === lightbox) {

      lightbox.classList.add("hidden");

    }

  });

} 
  // =========================
  // INITIAL RENDER
  // =========================

  renderCourses();

});
