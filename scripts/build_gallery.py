
import json
from pathlib import Path
from urllib.parse import quote

IMAGE_ROOT = Path("public/images/courses")
JSON_ROOT = Path("public/json")

EXTENSIONS = {
    ".jpg", ".jpeg", ".png",
    ".webp", ".gif", ".avif"
}

JSON_ROOT.mkdir(parents=True, exist_ok=True)


def image_url(path):
    relative = path.relative_to("public")
    return "/" + quote(relative.as_posix(), safe="/")


def collect_images(folder):
    files = [
        file for file in folder.rglob("*")
        if file.is_file()
        and file.suffix.lower() in EXTENSIONS
    ]

    return [
        image_url(file)
        for file in sorted(
            files,
            key=lambda f: str(f).lower()
        )
    ]


for course_folder in sorted(IMAGE_ROOT.iterdir()):

    if not course_folder.is_dir():
        continue

    course_name = course_folder.name
    categories = {}

    # Images directly in the course folder
    root_images = [
        f for f in course_folder.iterdir()
        if f.is_file()
        and f.suffix.lower() in EXTENSIONS
    ]

    if root_images:
        categories["general"] = [
            image_url(f)
            for f in sorted(
                root_images,
                key=lambda f: f.name.lower()
            )
        ]

    # Scan subfolders as categories
    for category_folder in sorted(course_folder.iterdir()):

        if not category_folder.is_dir():
            continue

        images = collect_images(category_folder)

        if images:
            categories[category_folder.name] = images

    output = JSON_ROOT / f"{course_name}.json"

    output.write_text(
        json.dumps(categories, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    total = sum(len(v) for v in categories.values())

    print(
        f"{course_name}: "
        f"{len(categories)} categories, "
        f"{total} images"
    )

    print(f"Generated: {output}")

print("All course galleries generated.")
