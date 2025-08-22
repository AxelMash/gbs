"use client";

import "./globals.css";
import { useEffect, useState } from "react";

function BodyWrapper({ children }) {
  const [theme, setTheme] = useState("slate");

  useEffect(() => {
    const saved = localStorage.getItem("marketcraft:theme");
    if (saved) setTheme(saved);
  }, []);

  const bodyClass =
    theme === "ffxiv"
      ? "min-h-screen bg-gradient-to-b from-[#0b1120] to-[#101a2c] text-[#f1e5c7]"
      : "min-h-screen bg-slate-950 text-slate-100";

  return <body className={bodyClass}>{children}</body>;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <BodyWrapper>{children}</BodyWrapper>
    </html>
  );
}
