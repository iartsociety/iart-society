
import { db } from "/js/firebase-config.js";

import {
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function requireRegisteredDevice(user) {
  if (!user) {
    throw new Error("Please sign in first.");
  }

  const storageKey = `iart-device-${user.uid}`;

  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(storageKey, deviceId);
  }

  const firstRef = doc(
    db, "users", user.uid, "devices", "device1"
  );

  const secondRef = doc(
    db, "users", user.uid, "devices", "device2"
  );

  return runTransaction(db, async (transaction) => {
    // Read both slots before making any changes.
    const first = await transaction.get(firstRef);
    const second = await transaction.get(secondRef);

    // This browser is already registered.
    if (
      (first.exists() &&
        first.data().deviceId === deviceId) ||
      (second.exists() &&
        second.data().deviceId === deviceId)
    ) {
      return true;
    }

    // Choose the first unused slot.
    let availableRef = null;

    if (!first.exists()) {
      availableRef = firstRef;
    } else if (!second.exists()) {
      availableRef = secondRef;
    }

    if (!availableRef) {
      throw new Error("DEVICE_LIMIT_REACHED");
    }

    // Register this browser.
    transaction.set(availableRef, {
      deviceId,
      registeredAt: serverTimestamp()
    });

    return true;
  });
}
