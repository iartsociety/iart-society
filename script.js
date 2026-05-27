import "./styles.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

const addButton = document.getElementById("add-course-btn");

addButton.addEventListener("click", () => {

  const code = prompt("Enter Course Code:");

  if (code === "DWHG26") {

    let courses = JSON.parse(localStorage.getItem("myCourses")) || [];

    if (!courses.includes("Diya Wall Hanging Guide")) {
      courses.push("Diya Wall Hanging Guide");

      localStorage.setItem("myCourses", JSON.stringify(courses));

      alert("Course Added!");
    } else {
      alert("You already unlocked this course.");
    }

  } else {
    alert("Invalid code.");
  }

});
