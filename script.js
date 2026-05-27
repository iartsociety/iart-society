import "./styles.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // COURSE DATABASE
  // =========================

  const courseCodes = {

    "DWHG26": {
      title: "Diya Wall Hanging Guide",
      description:
        "Learn how to create a beautiful traditional diya wall hanging step-by-step."
    }

  };

  // =========================
  // ELEMENTS
  // =========================

  const addButton =
    document.getElementById("add-course-btn");

  const coursesContainer =
    document.getElementById("courses-container");

  // =========================
  // LOAD SAVED COURSES
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
  // RENDER COURSES
  // =========================

  function renderCourses() {

    // ONLY run if container exists
    if (!coursesContainer) return;

    coursesContainer.innerHTML = "";

    myCourses.forEach(course => {

      const card =
        document.createElement("div");

      card.classList.add("course-card");

      card.innerHTML = `
        <h2>${course.title}</h2>
        <p>${course.description}</p>
      `;

      coursesContainer.appendChild(card);

    });

  }

  // =========================
  // BUTTON CLICK
  // =========================

  // ONLY run if button exists
  if (addButton) {

    addButton.addEventListener("click", () => {

      const enteredCode =
        prompt("Enter Course Code:");

      if (!enteredCode) return;

      const course =
        courseCodes[enteredCode];

      if (!course) {

        alert("Invalid Course Code.");
        return;

      }

      const alreadyUnlocked =
        myCourses.some(savedCourse =>
          savedCourse.title === course.title
        );

      if (alreadyUnlocked) {

        alert("Course already added.");
        return;

      }

      myCourses.push(course);

      saveCourses();

      alert("Course Added!");

    });

  }

  // =========================
  // INITIAL PAGE LOAD
  // =========================

  renderCourses();

});
