# iArtSociety — Firestore Activation Code Generator

This guide explains how to use `create_activation_codes.py` to generate unique student activation codes in bulk. Run the script **on your own computer**, not on the public website. It writes two matching Firestore documents for each code and exports a private CSV containing the codes to distribute to students.

## What it creates

For example, generating **5 codes** for the **Meenakshi 2D Tanjore** online group creates 10 Firestore documents in total (two per code):

```text
activationCodeLookup/{GENERATED_CODE}
  courseId: "meenakshi-2d-tanjore"
  groupId: "online"

activationCodes/meenakshi-2d-tanjore/groups/online/codes/{GENERATED_CODE}
  redeemedBy: null
  redeemedAt: null
```

Each code is randomly generated, uppercase, 12 characters by default, and intended for one-time use. The script uses Firestore `create()` operations, so it will not overwrite existing codes. Each pair of records is written together in a Firestore batch.

**Before running:** The target group document (for example, `activationCodes/meenakshi-2d-tanjore/groups/online`) must already exist in Firestore. The script does not create course or group metadata.

## 1. Save the Python script

Put `create_activation_codes.py` in the `scripts` folder of your local iArtSociety repository:

```text
iArtSociety/
├── public/
├── scripts/
│   └── create_activation_codes.py
├── firebase.json
└── .gitignore
```

Open the repository in VS Code. Open **Terminal → New Terminal**, and run the following commands from the repository root.

## 2. Install the Python dependency (one time)

On Windows:

```powershell
py -m pip install firebase-admin
```

This installs the Firebase Admin Python SDK required by the script.

## 3. Download a Firebase service-account key (one time)

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Select the **iArtSociety** project.
3. Go to **Project settings → Service accounts**.
4. Select **Generate new private key** and download the JSON.
5. Store it **outside the GitHub repository**, for example:

   ```text
   C:\FirebasePrivate\serviceAccountKey.json
   ```

**Security:** A service-account private key grants privileged project access and is not governed by your website's ordinary Firestore security rules. Never upload it to GitHub, Firebase Hosting, or the `public/` folder. Never send it to students. If it is exposed, revoke/delete that key in Google Cloud and generate a replacement.

## 4. Generate five Meenakshi online codes

Run this from the repository root in VS Code Terminal:

```powershell
py scripts/create_activation_codes.py --credentials "C:\FirebasePrivate\serviceAccountKey.json" --course meenakshi-2d-tanjore --group online --count 5 --output "meenakshi_online_codes.csv"
```

The script will print the Firebase project it connected to and the course/group destination. **Verify both before continuing.** When prompted, type:

```text
CREATE
```

It then creates the five activation codes and their five matching lookup documents, printing each code as it succeeds. The codes are also saved in `meenakshi_online_codes.csv` with these columns:

```csv
courseId,groupId,activationCode
```

**Do not rerun with the same output filename:** The script refuses to overwrite an existing CSV. Choose another filename if generating additional codes.

## 5. Generate five Meenakshi in-person codes

```powershell
py scripts/create_activation_codes.py --credentials "C:\FirebasePrivate\serviceAccountKey.json" --course meenakshi-2d-tanjore --group inperson --count 5 --output "meenakshi_inperson_codes.csv"
```

The group must exist as `activationCodes/meenakshi-2d-tanjore/groups/inperson`.

## 6. Generate codes for another course

For example, **10 GajaLakshmi online codes**:

```powershell
py scripts/create_activation_codes.py --credentials "C:\FirebasePrivate\serviceAccountKey.json" --course gajalakshmi --group online --count 10 --output "gajalakshmi_codes.csv"
```

Use the **exact Firestore course ID** and **group ID** for the course. These may differ from the short code students type on the website.

## 7. How a student activates their course

For Meenakshi Tanjore, students use:

- **Course code:** `M2D` (the short code associated with `meenakshi-2d-tanjore` in the Firestore `courses` collection).
- **Activation code:** One unique code from your private CSV.

Your existing Activate Course workflow reads `activationCodeLookup`, finds the assigned group, validates the corresponding code document, assigns the course to the student, and marks the code as redeemed.

Online and in-person students can use the same **short course code**. Their unique activation codes identify the correct group and therefore its `resourceConfig` JSON.

## 8. Verify the result in Firestore

In **Firebase Console → Firestore Database → Data**, confirm:

1. `activationCodeLookup/{CODE}` has `courseId` and `groupId` set correctly.
2. `activationCodes/{courseId}/groups/{groupId}/codes/{CODE}` has `redeemedBy: null` and `redeemedAt: null` (actual Firestore null values, not the string `"null"`).
3. After a student redeems a code, `redeemedBy` contains their Firebase UID and `redeemedAt` contains a timestamp.

The generator does not update `purchasedCourses` or `courseGroups` for a student; those are updated when the student redeems a code.

## 9. Keep generated codes private

The CSV is created in whichever directory you run the command from. Keep it outside your hosted `public/` folder and share each student **only their own code**.

Add this pattern to your repository's `.gitignore`:

```gitignore
*_codes.csv
```

For additional protection, store the CSV outside the repository altogether. The Python script itself can be committed to GitHub **as long as it does not contain credentials or student codes**.

## 10. Script options

| Option | Meaning | Default |
|---|---|---|
| `--credentials` | Path to service-account JSON | Required |
| `--course` | Firestore course ID | `meenakshi-2d-tanjore` |
| `--group` | Firestore group ID | `online` |
| `--count` | Number of codes | `5` (allowed 1–200) |
| `--length` | Characters per code | `12` (allowed 10–32) |
| `--output` | Destination CSV filename | `activation_codes.csv` |

### Troubleshooting

- **`No module named firebase_admin`** — Run `py -m pip install firebase-admin`.
- **`Service account JSON file not found`** — Check the path after `--credentials` and keep the quotes around Windows paths.
- **`Missing group document`** — Create the group document in Firestore first, then rerun.
- **`Output CSV already exists`** — Choose a fresh `--output` filename; the script intentionally avoids overwriting older code lists.
- **Permissions or authentication error** — Confirm the service-account key belongs to the correct Firebase project and has appropriate Firestore permissions.
- **Codes were created but CSV saving failed** — Check the terminal output and Firestore before rerunning. Codes already written to Firestore are not automatically rolled back if writing the local CSV fails.

---

**Important:** Running this script writes to the **live Firestore database** after you type `CREATE`. Check the displayed project and group carefully. It does **not** deploy the website or change your course JSON/video ordering.
