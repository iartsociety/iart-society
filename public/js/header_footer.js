
import { auth } from "/js/firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Display signed-in account holder
const accountContainer =
  document.getElementById("header-account");

const accountName =
  document.getElementById("account-name");

if (accountContainer && accountName) {

  if (user) {
    // Firebase Authentication display name
    const displayName =
      user.displayName ||
      user.email ||
      "Member";

    accountName.textContent = displayName;
    accountContainer.hidden = false;

  } else {
    accountName.textContent = "";
    accountContainer.hidden = true;
  }
}


// Load header and footer
async function loadComponent(elementId, filePath) {
  const container = document.getElementById(elementId);

  if (!container) return;

  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`Unable to load ${filePath}`);
  }

  container.innerHTML = await response.text();
}

async function initializeComponents() {
  try {
    await Promise.all([
      loadComponent("site-header", "/header.html"),
      loadComponent("site-footer", "/footer.html")
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
