
document.addEventListener("DOMContentLoaded", async () => {

  const galleries = document.querySelectorAll("[data-gallery]");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  const closeButton = document.getElementById("close-lightbox");
  const prevButton = document.getElementById("prev-image");
  const nextButton = document.getElementById("next-image");
  const counter = document.getElementById("image-counter");

  let currentImages = [];
  let currentIndex = 0;
  let previousFocus = null;

  // =========================
  // LOAD GALLERY IMAGES
  // =========================

  try {
    const response = await fetch("/json/galleries.json");

    if (!response.ok) {
      throw new Error("Gallery list could not be loaded");
    }

    const galleryData = await response.json();

    galleries.forEach(gallery => {
      const folderName = gallery.dataset.gallery;
      const images = galleryData[folderName] || [];

      gallery.replaceChildren();

      images.forEach((imagePath, index) => {
        const img = document.createElement("img");

        img.src = imagePath;
        img.alt = `Gallery image ${index + 1}`;
        img.loading = "lazy";
        img.tabIndex = 0;
        img.setAttribute("role", "button");

        gallery.appendChild(img);
      });

      if (!images.length) {
        gallery.textContent = "No images available yet.";
      }
    });

  } catch (error) {
    console.error("Gallery error:", error);
  }

  // =========================
  // LIGHTBOX NAVIGATION
  // =========================

  if (!lightbox || !lightboxImg ||
      !closeButton || !prevButton ||
      !nextButton || !counter) {
    return;
  }

  function displayImage() {
    if (!currentImages.length) return;

    const image = currentImages[currentIndex];

    lightboxImg.src = image.src;
    lightboxImg.alt = image.alt;

    counter.textContent =
      `${currentIndex + 1} / ${currentImages.length}`;
  }

  function openLightbox(image) {
    const gallery = image.closest("[data-gallery]");

    if (!gallery) return;

    currentImages = Array.from(
      gallery.querySelectorAll("img")
    ).filter(img => img.complete && img.naturalWidth > 0);

    currentIndex = currentImages.indexOf(image);

    if (currentIndex === -1) return;

    previousFocus = document.activeElement;

    displayImage();
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxImg.removeAttribute("src");
    document.body.style.overflow = "";
    previousFocus?.focus();
  }

  function nextImage() {
    if (!currentImages.length) return;

    currentIndex =
      (currentIndex + 1) % currentImages.length;

    displayImage();
  }

  function previousImage() {
    if (!currentImages.length) return;

    currentIndex =
      (currentIndex - 1 + currentImages.length)
      % currentImages.length;

    displayImage();
  }

  // Open image by click
  document.addEventListener("click", event => {
    const image = event.target.closest(
      "[data-gallery] img"
    );

    if (image) openLightbox(image);
  });

  // Open image by keyboard
  document.addEventListener("keydown", event => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target.matches("[data-gallery] img")
    ) {
      event.preventDefault();
      openLightbox(event.target);
      return;
    }

    if (lightbox.classList.contains("hidden")) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextImage();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousImage();
    }

    if (event.key === "Escape") {
      closeLightbox();
    }

    // Keep keyboard focus inside the lightbox
    if (event.key === "Tab") {
      const controls = [
        closeButton, prevButton, nextButton
      ];

      const index = controls.indexOf(
        document.activeElement
      );

      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        nextButton.focus();
      } else if (
        !event.shiftKey &&
        index === controls.length - 1
      ) {
        event.preventDefault();
        closeButton.focus();
      }
    }
  });

  // Arrow button clicks
  nextButton.addEventListener("click", nextImage);
  prevButton.addEventListener("click", previousImage);
  closeButton.addEventListener("click", closeLightbox);

  // Click background to close
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

});
