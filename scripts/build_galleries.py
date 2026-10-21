
import json
from pathlib import Path
from urllib.parse import quote

# Website image directory
IMAGE_ROOT = Path("public/images")

# Output file for the website
OUTPUT = Path("public/galleries.json")

# Supported image formats
EXTENSIONS = {
    ".jpg", ".jpeg", ".png",
    ".webp", ".gif", ".avif"
}

galleries = {}

if IMAGE_ROOT.exists():
    for folder in sorted(IMAGE_ROOT.iterdir()):
        if not folder.is_dir():
            continue

        images = []

        for file in sorted(
            folder.rglob("*"),
            key=lambda f: str(f).lower()
        ):
            if file.is_file() and file.suffix.lower() in EXTENSIONS:
                # Create a URL relative to the website root
                relative_path = file.relative_to("public")
                image_url = "/" + quote(
                    relative_path.as_posix(),
                    safe="/"
                )

                images.append(image_url)

        galleries[folder.name] = images

        print(
            f"{folder.name}: {len(images)} images found"
        )

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

OUTPUT.write_text(
    json.dumps(galleries, indent=2, ensure_ascii=False),
    encoding="utf-8"
)

print(f"Gallery manifest generated: {OUTPUT}")
