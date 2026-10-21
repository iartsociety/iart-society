
document.addEventListener("DOMContentLoaded", async () => {
  const galleries = document.querySelectorAll("[data-gallery]");

  try {
    const response = await fetch("/galleries.json");

    if (!response.ok) {
      throw new Error("Could not load gallery list");
    }

    const galleryData = await response.json();

    galleries.forEach(gallery => {
      const galleryName = gallery.dataset.gallery;
      const images = galleryData[galleryName] || [];

      images.forEach(imagePath => {
        const img = document.createElement("img");

        img.src = imagePath;
        img.alt = "Course gallery image";
        img.loading = "lazy";

        gallery.appendChild(img);
      });
    });

  } catch (error) {
    console.error("Gallery loading error:", error);
  }
});
