
document.addEventListener("DOMContentLoaded", async () => {

  const configPath = document.body.dataset.courseConfig;

  const titleElement = document.getElementById("course-title");
  const thumbnailElement = document.getElementById("course-thumbnail");
  const documentsContainer = document.getElementById("course-documents");
  const videosContainer = document.getElementById("course-videos");
  const imagesContainer = document.getElementById("course-images");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeButton = document.getElementById("close-lightbox");
  const prevButton = document.getElementById("prev-image");
  const nextButton = document.getElementById("next-image");
  const counter = document.getElementById("image-counter");

  let currentImages = [];
  let currentIndex = 0;

  // =========================
  // DOCUMENTS
  // =========================

  function loadDocuments(documents = []) {
    documentsContainer.replaceChildren();

    for (const documentInfo of documents) {
      const wrapper = document.createElement("div");

      const heading = document.createElement("h3");
      heading.textContent = documentInfo.title;

      const iframe = document.createElement("iframe");
      iframe.src = documentInfo.path;
      iframe.title = documentInfo.title;
      iframe.className = "pdf-viewer";
      iframe.loading = "lazy";

      const download = document.createElement("p");
      download.className = "pdf-download";

      const link = document.createElement("a");
      link.href = documentInfo.path;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open PDF in New Tab";

      download.appendChild(link);
      wrapper.append(heading, iframe, download);
      documentsContainer.appendChild(wrapper);
    }

    if (!documents.length) {
      documentsContainer.textContent = "No documents available yet.";
    }
  }

  // =========================
  // YOUTUBE VIDEOS
  // =========================

  function loadVideos(videos = []) {
    videosContainer.replaceChildren();

    for (const video of videos) {
      const wrapper = document.createElement("div");
      wrapper.className = "video-lesson";

      const heading = document.createElement("h3");
      heading.textContent = video.title;

      const iframe = document.createElement("iframe");
      iframe.src = video.url;
      iframe.title = video.title;
      iframe.loading = "lazy";
      iframe.allow =
        "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";

      wrapper.append(heading, iframe);
      videosContainer.appendChild(wrapper);
    }

    if (!videos.length) {
      videosContainer.textContent = "Videos coming soon.";
    }
  }

  // =========================
  // IMAGE CATEGORIES
  // =========================

  async function loadImages(manifestPath) {
    imagesContainer.textContent = "Loading images...";

    if (!manifestPath) {
      imagesContainer.textContent = "No images available yet.";
      return;
    }

    const response = await fetch(manifestPath);

    if (!response.ok) {
      throw new Error("Image manifest could not be loaded");
    }

    const categories = await response.json();
    imagesContainer.replaceChildren();

    for (const [categoryName, imagePaths] of Object.entries(categories)) {
      if (!Array.isArray(imagePaths) || !imagePaths.length) continue;

      const section = document.createElement("section");
      section.className = "gallery-category";

      const heading = document.createElement("h3");
      heading.textContent = categoryName
        .replace(/[_-]/g, " ");

      const row = document.createElement("div");
      row.className = "horizontal-gallery";

      imagePaths.forEach((path, index) => {
        const img = document.createElement("img");
        img.src = path;
        img.alt = `${categoryName} image ${index + 1}`;
        img.loading = "lazy";
        img.tabIndex = 0;
        img.setAttribute("role", "button");

        row.appendChild(img);
      });

      section.append(heading, row);
      imagesContainer.appendChild(section);
    }

    if (!imagesContainer.children.length) {
      imagesContainer.textContent = "No images available yet.";
    }
  }

  // =========================
  // IMAGE LIGHTBOX
  // =========================

  function showImage() {
    if (!currentImages.length) return;

    lightboxImg.src = currentImages[currentIndex].src;
    lightboxImg.alt = currentImages[currentIndex].alt;

    counter.textContent =
      `${currentIndex + 1} / ${currentImages.length}`;
  }

  function openLightbox(image) {
    const row = image.closest(".horizontal-gallery");
    if (!row || !lightbox) return;

    // Navigation stays within the selected category.
    currentImages = Array.from(row.querySelectorAll("img"));
    currentIndex = currentImages.indexOf(image);

    if (currentIndex < 0) return;

    showImage();
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxImg.removeAttribute("src");
    document.body.style.overflow = "";
  }

  function moveImage(direction) {
    if (!currentImages.length) return;

    currentIndex =
      (currentIndex + direction + currentImages.length)
      % currentImages.length;

    showImage();
  }

  if (lightbox && lightboxImg && closeButton &&
      prevButton && nextButton && counter) {

    imagesContainer.addEventListener("click", event => {
      if (event.target.matches(".horizontal-gallery img")) {
        openLightbox(event.target);
      }
    });

    imagesContainer.addEventListener("keydown", event => {
      if (
        event.target.matches(".horizontal-gallery img") &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        openLightbox(event.target);
      }
    });

    prevButton.addEventListener("click", () => moveImage(-1));
    nextButton.addEventListener("click", () => moveImage(1));
    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", event => {
      if (lightbox.classList.contains("hidden")) return;

      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveImage(-1);
      if (event.key === "ArrowRight") moveImage(1);
    });
  }

  // =========================
  // LOAD COURSE CONFIGURATION
  // =========================

  try {
    if (!configPath) {
      throw new Error("Missing course configuration path");
    }

    const response = await fetch(configPath);

    if (!response.ok) {
      throw new Error("Course configuration could not be loaded");
    }

    const course = await response.json();

    titleElement.textContent = course.title;
    thumbnailElement.src = course.thumbnail;

    loadDocuments(course.documents);
    loadVideos(course.videos);

    try {
      await loadImages(course.images?.manifest);
    } catch (error) {
      console.error("Image gallery error:", error);
      imagesContainer.textContent = "Unable to load images.";
    }

  } catch (error) {
    console.error("Course loading error:", error);
    titleElement.textContent = "Unable to load course.";
  }

});
