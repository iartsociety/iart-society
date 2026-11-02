"""Generate one-time iArtSociety activation codes in both Firestore collections.

Run locally, never from public website or GitHub Actions with a private key.
"""
import argparse
import csv
import secrets
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore
from google.api_core.exceptions import AlreadyExists

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # Avoid ambiguous 0/O and 1/I


def new_code(length: int) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))


def main():
    parser = argparse.ArgumentParser(description="Create iArtSociety Firestore activation codes")
    parser.add_argument("--credentials", required=True, type=Path, help="Local Firebase service-account JSON")
    parser.add_argument("--course", default="meenakshi-2d-tanjore")
    parser.add_argument("--group", default="online", help="e.g. online or inperson")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--length", type=int, default=12)
    parser.add_argument("--output", type=Path, default=Path("activation_codes.csv"))
    args = parser.parse_args()

    if not 1 <= args.count <= 200:
        parser.error("--count must be from 1 to 200")
    if not 4 <= args.length <= 32:
        parser.error("--length must be from 4 to 32")
    if not args.credentials.is_file():
        parser.error("Service account JSON file not found")
    if args.output.exists():
        parser.error("Output CSV already exists; choose a new filename to avoid overwriting prior codes")
    if args.course.strip() != args.course or args.group.strip() != args.group:
        parser.error("Course/group cannot have leading or trailing spaces")

    cred = credentials.Certificate(str(args.credentials))
    app = firebase_admin.initialize_app(cred)
    db = firestore.client(app=app)
    print(f"Connected to Firebase project: {app.project_id}")
    print(f"Target: {args.course} / {args.group}")
    confirmation = input("Type CREATE to write new codes to Firestore: ").strip()
    if confirmation != "CREATE":
        print("Cancelled. No codes created.")
        return

    group_ref = db.collection("activationCodes").document(args.course).collection("groups").document(args.group)
    if not group_ref.get().exists:
        raise RuntimeError(f"Missing group document: {group_ref.path}. Create it first.")

    output = []
    for _ in range(args.count):
        for attempt in range(20):
            code = new_code(args.length)
            lookup_ref = db.collection("activationCodeLookup").document(code)
            code_ref = group_ref.collection("codes").document(code)
            batch = db.batch()
            # create() fails instead of overwriting any existing code, including redeemed codes.
            batch.create(lookup_ref, {"courseId": args.course, "groupId": args.group})
            batch.create(code_ref, {"redeemedBy": None, "redeemedAt": None})
            try:
                batch.commit()  # both documents succeed together or neither does
                output.append((args.course, args.group, code))
                print(f"Created {len(output)}/{args.count}: {code}")
                break
            except AlreadyExists:
                if attempt == 19:
                    raise RuntimeError("Repeated activation code collisions")
        else:
            raise RuntimeError("Unable to generate a unique code")

    # Write only successfully created codes to local CSV, not a hosted/public folder.
    with args.output.open("x", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["courseId", "groupId", "activationCode"])
        writer.writerows(output)

    print(f"\nCreated {len(output)} code(s) and saved to {args.output.resolve()}")
    print("Keep this CSV private. Do not commit the CSV or service account key to GitHub.")


if __name__ == "__main__":
    main()
