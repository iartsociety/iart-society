
"""Read-only audit of iArtSociety Firestore activation codes.

Requires: pip install firebase-admin
Uses a local service-account JSON.
Never place the key or output CSV in public/.
"""

import argparse
import csv
from collections import Counter
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


def classify(data, lookup, course_id, group_id):
    """Return status and diagnostic message without changing Firestore."""

    problems = []

    # Check activationCodeLookup document
    if lookup is None:
        problems.append(
            "Missing activationCodeLookup document"
        )
    else:
        if "courseId" not in lookup or "groupId" not in lookup:
            problems.append(
                "Lookup needs exact field names courseId and groupId"
            )

        if lookup.get("courseId") != course_id:
            problems.append(
                "Lookup courseId does not match code location"
            )

        if lookup.get("groupId") != group_id:
            problems.append(
                "Lookup groupId does not match code location"
            )

    # Check redemption fields
    if "redeemedBy" not in data or "redeemedAt" not in data:
        problems.append(
            "Code missing redeemedBy or redeemedAt field"
        )

    redeemed_by = data.get("redeemedBy")
    redeemed_at = data.get("redeemedAt")

    # Optional field: who received the code
    assigned_to = data.get("assignedTo", "")

    if assigned_to is not None and not isinstance(
        assigned_to, str
    ):
        problems.append(
            "assignedTo should be a string or absent"
        )

    assigned_name = (
        assigned_to.strip()
        if isinstance(assigned_to, str)
        else ""
    )

    # Check for inconsistent redemption status
    if (redeemed_by is None) != (redeemed_at is None):
        problems.append(
            "redeemedBy and redeemedAt disagree"
        )

    elif redeemed_by is not None and not isinstance(
        redeemed_by, str
    ):
        problems.append(
            "redeemedBy should be a UID string"
        )

    elif redeemed_by == "":
        problems.append(
            "redeemedBy is an empty string, not null"
        )

    # Any inconsistent record needs manual review
    if problems:
        return (
            "REVIEW",
            "; ".join(dict.fromkeys(problems))
        )

    # Already redeemed
    if redeemed_by is not None:
        return "REDEEMED", "Already used"

    # Assigned to a student but not redeemed
    if assigned_name:
        return (
            "ASSIGNED",
            "Given to " + assigned_name + "; not yet redeemed"
        )

    # Unassigned and unused
    return (
        "AVAILABLE",
        "Unassigned and ready to distribute"
    )


def main():

    parser = argparse.ArgumentParser(
        description="Read-only iArtSociety activation code audit"
    )

    parser.add_argument(
        "--credentials",
        required=True,
        type=Path
    )

    parser.add_argument(
        "--course",
        help="Optional Firestore course ID, e.g. gajalakshmi"
    )

    parser.add_argument(
        "--group",
        help="Optional group ID; requires --course"
    )

    parser.add_argument(
        "--available-only",
        action="store_true",
        help="Export only unassigned, unused, valid codes"
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=Path("activation_code_audit.csv")
    )

    args = parser.parse_args()

    if args.group and not args.course:
        parser.error("--group requires --course")

    if not args.credentials.is_file():
        parser.error("Credentials file not found")

    if args.output.suffix.lower() != ".csv":
        parser.error("Output must be a .csv file")

    # Connect to Firebase using the admin key
    app = firebase_admin.initialize_app(
        credentials.Certificate(
            str(args.credentials)
        )
    )

    db = firestore.client(app=app)

    print("Connected to project:", app.project_id)

    # Select courses
    if args.course:
        course_refs = [
            db.collection("activationCodes").document(
                args.course
            )
        ]
    else:
        course_refs = [
            snap.reference
            for snap in db.collection(
                "activationCodes"
            ).stream()
        ]

    rows = []

    # Audit each course
    for course_ref in course_refs:

        # Select groups
        if args.group:
            groups = [
                course_ref.collection(
                    "groups"
                ).document(args.group)
            ]
        else:
            groups = [
                snap.reference
                for snap in course_ref.collection(
                    "groups"
                ).stream()
            ]

        for group_ref in groups:

            # Retrieve activation codes
            code_snaps = list(
                group_ref.collection("codes").stream()
            )

            if not code_snaps:
                print(
                    f"No codes found for "
                    f"{course_ref.id}/{group_ref.id}"
                )
                continue

            # Retrieve corresponding lookup records
            lookup_refs = [
                db.collection(
                    "activationCodeLookup"
                ).document(snap.id)
                for snap in code_snaps
            ]

            lookup_snaps = list(
                db.get_all(lookup_refs)
            )

            lookups = {
                snap.id: snap.to_dict()
                for snap in lookup_snaps
                if snap.exists
            }

            # Classify each activation code
            for code_snap in code_snaps:

                data = code_snap.to_dict() or {}

                lookup = lookups.get(
                    code_snap.id
                )

                status, note = classify(
                    data,
                    lookup,
                    course_ref.id,
                    group_ref.id
                )

                redeemed_at = data.get(
                    "redeemedAt"
                )

                if hasattr(redeemed_at, "isoformat"):
                    redeemed_at_value = (
                        redeemed_at.isoformat()
                    )
                elif redeemed_at is not None:
                    redeemed_at_value = str(
                        redeemed_at
                    )
                else:
                    redeemed_at_value = ""

                assigned_to = data.get(
                    "assignedTo", ""
                )

                if not isinstance(assigned_to, str):
                    assigned_to = ""

                rows.append({
                    "courseId": course_ref.id,
                    "groupId": group_ref.id,
                    "activationCode": code_snap.id,
                    "status": status,
                    "assignedTo": assigned_to,
                    "redeemedBy": (
                        data.get("redeemedBy") or ""
                    ),
                    "redeemedAt": redeemed_at_value,
                    "notes": note
                })

    # Show summary
    counts = Counter(
        row["status"]
        for row in rows
    )

    print(
        f"Checked {len(rows)} codes: "
        f"{counts['AVAILABLE']} available, "
        f"{counts['ASSIGNED']} assigned but unused, "
        f"{counts['REDEEMED']} redeemed, "
        f"{counts['REVIEW']} need review"
    )

    # Optionally export only available codes
    if args.available_only:
        export_rows = [
            row for row in rows
            if row["status"] == "AVAILABLE"
        ]
    else:
        export_rows = rows

    # CSV output
    args.output.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    columns = [
        "courseId",
        "groupId",
        "activationCode",
        "status",
        "assignedTo",
        "redeemedBy",
        "redeemedAt",
        "notes"
    ]

    with args.output.open(
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=columns
        )

        writer.writeheader()
        writer.writerows(export_rows)

    print(
        f"Exported {len(export_rows)} rows to "
        f"{args.output.resolve()}"
    )

    print(
        "Keep this CSV private. "
        "Do not commit it to GitHub."
    )

    print(
        "Note: only code documents are inventoried; "
        "orphan lookup-only records are not included."
    )


if __name__ == "__main__":
    main()
