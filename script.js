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
    }
  };

  // =========================
  // ELEMENTS
  // =========================

  const addButton = document.getElementById("add-course-btn");
  const popup = document.getElementById("course-popup");
  const closeButton = document.getElementById("close-popup-btn");
  const submitButton = document.getElementById("submit-code-btn");
  const input = document.getElementById("course-code-input");
  const coursesContainer = document.getElementById("courses-container");

  // =========================
  // LOAD COURSES
  // =========================

  let myCourses =
    JSON.parse(localStorage.getItem("myCourses")) || [];

  function saveCourses() {
    localStorage.setItem("myCourses", JSON.stringify(myCourses));
  }

  // =========================
  // RENDER COURSES
  // =========================

  function renderCourses() {
    if (!coursesContainer) return;

    coursesContainer.innerHTML = "";

    myCourses.forEach(courseId => {

      const course = Object.values(courseCodes)
        .find(c => c.id === courseId);

      if (!course) return;

      const link = document.createElement("a");
      link.className = "course-card";
      link.href = course.page;
      link.innerHTML = `
        <img
          src="${course.image}"
          alt="${course.title}"
          class="course-image"
        >
      
        <div class="course-info">
          <h2>${course.title}</h2>
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
      popup.classList.remove("hidden");
    });
  }

  // =========================
  // CLOSE POPUP (X BUTTON)
  // =========================

  if (closeButton && popup) {
    closeButton.addEventListener("click", () => {
      popup.classList.add("hidden");
    });
  }

  // click outside popup to close
  if (popup) {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.classList.add("hidden");
      }
    });
  }

  // =========================
  // SUBMIT CODE
  // =========================

  if (submitButton && input && popup) {
    submitButton.addEventListener("click", () => {

      const enteredCode = input.value.trim().toUpperCase();

      const course = courseCodes[enteredCode];

      if (!course) {
        alert("Invalid Course Code");
        return;
      }

      const alreadyUnlocked = myCourses.includes(course.id);

      if (alreadyUnlocked) {
        alert("Course already added.");
        return;
      }

      myCourses.push(course.id);
      saveCourses();
      renderCourses();

      popup.classList.add("hidden");
      input.value = "";

      alert("Course Added!");
    });
  }

  // =========================
  // INIT
  // =========================

  renderCourses();

});
