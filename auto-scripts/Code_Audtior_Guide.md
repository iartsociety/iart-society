
# iArtSociety — Activation Code Auditor Guide

This guide explains how to use `audit_activation_codes.py` to inspect activation codes stored in Firebase Firestore and export an Excel-compatible CSV report.

The script is READ-ONLY. It does not create, redeem, modify, or delete any activation codes.

## 1. What the auditor checks

Each activation code is stored at:

activationCodes/{courseId}/groups/{groupId}/codes/{code}

The auditor checks:

- The activation code document exists.
- The matching activationCodeLookup document exists.
- courseId matches the Firestore course.
- groupId matches the Firestore group.
- redeemedBy and redeemedAt are valid.
- assignedTo identifies who received the code.

### Audit statuses

| Status | Meaning |
|---|---|
| AVAILABLE | Unused, unassigned, and correctly configured. |
| ASSIGNED | Given to someone but not yet redeemed. |
| REDEEMED | Already redeemed by a student. |
| REVIEW | Missing or incorrect Firestore fields or inconsistent data. |

### Important distinction

ASSIGNED does not mean REDEEMED.

For example:

assignedTo: "Subhiksha"
redeemedBy: null
redeemedAt: null

This code will show:

Status: ASSIGNED

It is not available for distribution to another student.

## 2. Install the Python script

Save the Python file at:

auto-scripts/audit_activation_codes.py

Your project structure:

iart-society/
  auto-scripts/
    audit_activation_codes.py
    create_activation_codes_short.py
  docs/
    activation-code-auditor.md
  public/
  firebase.json
  .gitignore

Keep your Firebase service-account private key outside the repository.

Example location:

C:\FirebasePrivate\iart-society-firebase-key.json

Never commit the private key to GitHub.

## 3. Install Firebase Admin SDK

Open VS Code.

Open Terminal in the auto-scripts folder.

Run:

    py -m pip install --upgrade firebase-admin

Use Python 3.11 or newer if possible.

You only need to install this package once per Python environment.

## 4. Audit all courses

Run this command from the auto-scripts folder:

    py ".\audit_activation_codes.py" `
      --credentials "C:\FirebasePrivate\iart-society-firebase-key.json" `
      --output "all_activation_codes.csv"

This retrieves all activation codes across courses and learning groups.

The CSV can be opened in Excel.

## 5. Get available Gajalakshmi codes

Run:

    py ".\audit_activation_codes.py" `
      --credentials "C:\FirebasePrivate\iart-society-firebase-key.json" `
      --course "gajalakshmi" `
      --group "online27" `
      --available-only `
      --output "gajalakshmi_available_codes.csv"

This outputs only codes that are:

- Not redeemed.
- Not assigned to a student.
- Correctly configured in Firestore.

Assigned codes are excluded even when redeemedBy is null.

## 6. Audit Meenakshi activation codes

Run:

    py ".\audit_activation_codes.py" `
      --credentials "C:\FirebasePrivate\iart-society-firebase-key.json" `
      --course "meenakshi-2d-tanjore" `
      --output "meenakshi_code_audit.csv"

This includes all Meenakshi learning groups.

To audit only the November online group:

    py ".\audit_activation_codes.py" `
      --credentials "C:\FirebasePrivate\iart-society-firebase-key.json" `
      --course "meenakshi-2d-tanjore" `
      --group "online-nov-26" `
      --output "meenakshi_nov26_code_audit.csv"

## 7. CSV output fields

The script creates these columns:

| Column | Description |
|---|---|
| courseId | Firestore course ID. |
| groupId | Learning group ID. |
| activationCode | Unique activation code. |
| status | AVAILABLE, ASSIGNED, REDEEMED, or REVIEW. |
| assignedTo | Name of the student who received the code. |
| redeemedBy | Firebase UID of the student who redeemed it. |
| redeemedAt | Redemption timestamp. |
| notes | Explanation of the status or problem. |

### Example CSV

courseId,groupId,activationCode,status,assignedTo,redeemedBy,redeemedAt,notes
gajalakshmi,online27,A7B2,AVAILABLE,,,,Unassigned and ready to distribute
meenakshi-2d-tanjore,online-nov-26,ZZYS,ASSIGNED,Subhiksha,,,Given to Subhiksha; not yet redeemed
gajalakshmi,online27,K8P4,REDEEMED,Meera,STUDENT_UID,2026-11-05T18:30:00+00:00,Already used
gajalakshmi,online27,R6T9,REVIEW,,,,Lookup needs exact field names courseId and groupId

These are examples, not actual Firebase records.

## 8. How to assign a code to a student

Open Firebase Console.

Go to:

Firestore Database > Data

Navigate to:

activationCodes
  > COURSE_ID
  > groups
  > GROUP_ID
  > codes
  > ACTIVATION_CODE

Select Add field.

Field name:

assignedTo

Type:

String

Value:

Student's name

Example:

assignedTo: "Subhiksha"

Do not change:

redeemedBy: null
redeemedAt: null

### What happens afterward?

When the auditor runs:

- assignedTo is filled and redemption is null:
  ASSIGNED

- redeemedBy and redeemedAt are filled:
  REDEEMED

- assignedTo is missing or blank and redemption is null:
  AVAILABLE

- Fields are inconsistent:
  REVIEW

assignedTo is an administrative tracking field only.

It does NOT restrict who may redeem a code.

## 9. Example terminal summary

After running the script, the terminal may show:

Connected to project: iart-society

Checked 12 codes:
5 available
2 assigned but unused
3 redeemed
2 need review

Exported 12 rows to all_activation_codes.csv

These figures are illustrative.

## 10. Keep private files out of GitHub

Add the following to the repository-root .gitignore:

    # Firebase Admin credentials
    /auto-scripts/iart-society-firebase-key.json
    **/*firebase-key.json
    **/*serviceAccountKey.json

    # Activation code reports
    /auto-scripts/*.csv

CSV files may contain unused activation codes.

Do not publish or commit them.

If a key was previously committed, .gitignore does not remove it from Git history.

## 11. Troubleshooting

### Missing credentials

Error:

the following arguments are required: --credentials

Ensure the command includes --credentials and a valid path.

### Firebase Admin is not installed

Error:

ModuleNotFoundError: No module named firebase_admin

Run:

    py -m pip install firebase-admin

### Code shows REVIEW

Check the notes column.

Possible causes:

- Missing lookup document.
- Incorrect courseId field.
- Incorrect groupId field.
- Missing redeemedBy or redeemedAt.
- Redemption fields disagree.
- Invalid assignedTo data type.

Correct the record in Firebase Console.

### No codes found

Verify the course ID and group ID.

For example:

courseId: gajalakshmi
groupId: online27

The names must match Firestore exactly.

### Python version warnings

Upgrade to a supported Python version, preferably Python 3.11 or newer.

## 12. Important limitations

The script:

- Does not modify Firestore.
- Does not reserve codes automatically.
- Does not guarantee that assignedTo matches the person redeeming a code.
- Does not verify every redeemed student's enrollment.
- Does not detect lookup-only records missing their corresponding code document.
- Uses Firestore reads, which count toward usage limits.
- Reports the status at the moment of the audit.

A code can be redeemed after the report is generated.

## 13. Recommended workshop workflow

1. Run the auditor before each workshop.
2. Open the CSV in Excel.
3. Filter for AVAILABLE codes.
4. Do not redistribute ASSIGNED codes.
5. Investigate any REVIEW records.
6. If needed, generate new codes with create_activation_codes_short.py.
7. Run the auditor again.
8. Give one available code to each student.
9. Update assignedTo in Firebase.
10. Audit again to confirm the codes show ASSIGNED.

## Summary

Use two separate Python tools:

create_activation_codes_short.py
  Generates new codes and creates Firestore records.

audit_activation_codes.py
  Audits existing codes, tracks assignment and redemption,
  and exports CSV reports.

The auditor does not require changes to the
iArtSociety website or course_catalog.json.
