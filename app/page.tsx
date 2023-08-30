"use client";

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";

export default function Home() {
  const notification = async () => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }
    if (permissionGranted) {
      sendNotification("Tauri is awesome!");
      sendNotification({ title: "TAURI", body: "Tauri is awesome!" });
    }
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <button onClick={notification}>yo</button>
    </main>
  );
}
