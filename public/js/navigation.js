
import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const authNavLink = document.getElementById("auth-nav-link");

if (authNavLink) {
  onAuthStateChanged(auth, (user) => {

    if (user) {
      // Student is signed in
      authNavLink.textContent = "My Courses";
      authNavLink.href = "/courses.html";

    } else {
      // Visitor is not signed in
      authNavLink.textContent = "Login";
      authNavLink.href = "/login.html";
    }

  });
}
