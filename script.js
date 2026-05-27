import "./styles.css";

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
      title: "Diya Wall Hanging Guide",
      description:
        "Learn how to create a traditional diya wall hanging step-by-step."
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
  // OPEN POPUP
  // =========================

  addButton.addEventListener("click", () => {

    popup.classList.remove("hidden");

  });

  // =========================
  // SUBMIT CODE
  // =========================

  submitButton.addEventListener("click", () => {

    const enteredCode =
      input.value.trim();

    const course =
      courseCodes[enteredCode];

    if (!course) {

      alert("Invalid Course Code");
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

    renderCourses();

    popup.classList.add("hidden");

    input.value = "";

    alert("Course Added!");

  });

  // =========================
  // INITIAL LOAD
  // =========================

  renderCourses();

});
