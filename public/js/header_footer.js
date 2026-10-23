
import { auth } from "/js/firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Load a shared HTML component
async function loadComponent(elementId, filePath) {
  const container = document.getElementById(elementId);

  if (!container) return;

  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(
      `Unable to load component: ${filePath}`
    );
  }

  container.innerHTML = await response.text();
}

// Load header and footer
async function initializeComponents() {
  try {
    await Promise.all([
      loadComponent(
        "site-header",
        "/components/header.html"
      ),
      loadComponent(
        "site-footer",
        "/components/footer.html"
      )
    ]);

    // Footer is available after loading
    const authLink =
      document.getElementById("auth-nav-link");

    const logoutButton =
      document.getElementById("logout-btn");

    onAuthStateChanged(auth, user => {
      if (authLink) {
        authLink.textContent = user
          ? "My Courses"
          : "Login";

        authLink.href = user
          ? "/courses.html"
          : "/login.html";
      }

      if (logoutButton) {
        logoutButton.hidden = !user;
      }
    });

    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        try {
          logoutButton.disabled = true;

          await signOut(auth);
          window.location.replace("/login.html");

        } catch (error) {
          console.error("Logout failed:", error);
          logoutButton.disabled = false;
        }
      });
    }

  } catch (error) {
    console.error("Component loading error:", error);
  }
}

initializeComponents();
