
import { auth } from "/js/firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Load shared HTML
async function loadComponent(elementId, filePath) {
  const container = document.getElementById(elementId);

  if (!container) return;

  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`Unable to load ${filePath}`);
  }

  container.innerHTML = await response.text();
}

// Initialize header and footer
async function initializeComponents() {
  try {
    await Promise.all([
      loadComponent("site-header", "/header.html"),
      loadComponent("site-footer", "/footer.html")
    ]);

    const loginButton = document.getElementById("login-btn");
    const myCoursesButton = document.getElementById("my-courses-btn");
    const logoutButton = document.getElementById("logout-btn");

    const accountContainer =
      document.getElementById("header-account");

    const accountName =
      document.getElementById("account-name");

    // Update navigation when login status changes
    onAuthStateChanged(auth, user => {

      if (loginButton) {
        loginButton.hidden = !!user;
      }

      if (myCoursesButton) {
        myCoursesButton.hidden = !user;
      }

      if (logoutButton) {
        logoutButton.hidden = !user;
      }

      // Header account holder
      if (accountContainer && accountName) {
        if (user) {
          accountName.textContent =
            user.displayName || user.email || "Member";

          accountContainer.hidden = false;
        } else {
          accountName.textContent = "";
          accountContainer.hidden = true;
        }
      }
    });

    // Log out
    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        try {
          logoutButton.disabled = true;

          await signOut(auth);

          window.location.replace("/login.html");

        } catch (error) {
          console.error("Logout failed:", error);
          alert("Unable to log out. Please try again.");
          logoutButton.disabled = false;
        }
      });
    }

  } catch (error) {
    console.error("Header/footer loading error:", error);
  }
}

initializeComponents();
