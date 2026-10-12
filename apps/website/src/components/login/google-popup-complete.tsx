"use client";
import { useEffect } from "react";

export function GooglePopupComplete() {
  useEffect(() => {
    window.close();
  }, []);
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeContent: "center",
        gap: "16px",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <p>Return to your original sign-in window to continue.</p>
      <button onClick={() => window.close()}>Close this window</button>
    </main>
  );
}
