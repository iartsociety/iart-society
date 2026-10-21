
document.addEventListener("DOMContentLoaded", async () => {
  const galleries = document.querySelectorAll(
    "[data-gallery]"
  );

  try {
    const response = await fetch("/galleries.json");

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

        gallery.appendChild(img);
      });

      if (images.length === 0) {
        gallery.textContent = "No images available yet.";
      }
    });

  } catch (error) {
    console.error("Gallery error:", error);
  }

  // Lightbox functionality for dynamically loaded images
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeButton = document.getElementById("close-lightbox");

  if (lightbox && lightboxImg && closeButton) {
    document.addEventListener("click", event => {
      const image = event.target.closest(
        "[data-gallery] img"
      );

      if (!image) return;

      lightboxImg.src = image.src;
      lightboxImg.alt = image.alt;
      lightbox.classList.remove("hidden");
    });

    function closeLightbox() {
      lightbox.classList.add("hidden");
      lightboxImg.removeAttribute("src");
    }

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    });
  }
});
