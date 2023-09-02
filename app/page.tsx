"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";

export default function Home() {
  const [lol, setLol] = useState("fail");
  useEffect(() => {
    invoke<string>("greet", { name: "kreme" })
      .then((m) => setLol(m))
      .catch(console.error);
  }, []);

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
      <button onClick={notification}>send notification</button>
      <div className="text-red-500">{lol}</div>
    </main>
  );
}
