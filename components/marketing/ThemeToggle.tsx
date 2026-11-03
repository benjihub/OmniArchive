"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function applyTheme(isLight: boolean) {
  document.documentElement.dataset.theme = isLight ? "light" : "dark";
  document.documentElement.style.colorScheme = isLight ? "light" : "dark";
}

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("omniarchive-theme");
    const light = savedTheme === "light";
    setIsLight(light);
    applyTheme(light);
  }, []);

  const toggle = () => {
    const nextIsLight = !isLight;
    setIsLight(nextIsLight);
    localStorage.setItem("omniarchive-theme", nextIsLight ? "light" : "dark");
    applyTheme(nextIsLight);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-[#131B2E]/80 text-slate-300 transition hover:border-indigo-400/50 hover:text-white"
    >
      {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
    </button>
  );
}
