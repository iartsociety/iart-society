import "./styles.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

window.addEventListener("DOMContentLoaded", () => {

  const addButton = document.getElementById("add-course-btn");

  addButton.addEventListener("click", () => {

    const code = prompt("Enter Course Code:");

    if (code === "DWHG26") {

      let courses =
        JSON.parse(localStorage.getItem("myCourses")) || [];

      if (!courses.includes("Digital Wellness")) {

        courses.push("Digital Wellness");

        localStorage.setItem(
          "myCourses",
          JSON.stringify(courses)
        );

        alert("Course Added!");

      } else {

        alert("You already unlocked this course.");

      }

    } else {

      alert("Invalid code.");

    }

  });

});

const container = document.getElementById("courses-container");

const courses = JSON.parse(localStorage.getItem("myCourses")) || [];

courses.forEach(course => {

  const courseCard = document.createElement("div");

  courseCard.innerText = course;

  courseCard.classList.add("course-card");

  container.appendChild(courseCard);

});
