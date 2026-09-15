"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f13",
        color: "#a1a1aa",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", color: "#fafafa" }}>Storybook Studio</h1>
        <p>Loading…</p>
      </div>
    </main>
  );
}
