console.log("JS is connected");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

document.addEventListener("DOMContentLoaded", () => {

const closeButton = document.getElementById("close-popup-btn");
const popup = document.getElementById("course-popup");

closeButton.addEventListener("click", () => {
  popup.classList.add("hidden");
});

  // =========================
  // COURSE DATABASE
  // =========================

  const courseCodes = {
    "DWHG26": {
      id: "diya-wall-hanging",
      title: "Diya Wall Hanging Guide",
      page: "diya.html"
    }
  };

  // =========================
  // ELEMENTS
  // =========================

  const addButton =
    document.getElementById("add-course-btn");

  const popup =
    document.getElementById("course-popup");

  const submitButton =
    document.getElementById("submit-code-btn");

  const input =
    document.getElementById("course-code-input");

  const coursesContainer =
    document.getElementById("courses-container");

  // =========================
  // LOAD SAVED COURSES (STORE IDS ONLY)
  // =========================

  let myCourses =
    JSON.parse(localStorage.getItem("myCourses")) || [];

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
  // RENDER COURSES AS BUTTONS
  // =========================

  function renderCourses() {

    if (!coursesContainer) return;

    coursesContainer.innerHTML = "";

    myCourses.forEach(courseId => {

      // find full course data from code map
      const course = Object.values(courseCodes)
        .find(c => c.id === courseId);

      if (!course) return;

      const link = document.createElement("a");

      link.classList.add("course-card");
      link.href = course.page;

      link.innerText = course.title;

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
  // SUBMIT CODE
  // =========================

  if (submitButton) {
    submitButton.addEventListener("click", () => {

      const enteredCode = input.value.trim();

      const course = courseCodes[enteredCode];

      if (!course) {
        alert("Invalid Course Code");
        return;
      }

      const alreadyUnlocked =
        myCourses.includes(course.id);

      if (alreadyUnlocked) {
        alert("Course already added.");
        return;
      }

      // STORE ONLY ID
      myCourses.push(course.id);

      saveCourses();

      renderCourses();

      popup.classList.add("hidden");

      input.value = "";

      alert("Course Added!");
    });
  }

  // =========================
  // INITIAL LOAD
  // =========================

  renderCourses();

});
