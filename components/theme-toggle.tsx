"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-md border border-border flex items-center justify-center opacity-50">
        <span className="w-5 h-5 rounded-full bg-muted/20"></span>
      </div>
    );
  }

  // Determine if active theme is dark (considering system preference if theme is 'system')
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-lg sm:w-10 sm:h-10 sm:rounded-xl bg-card/60 backdrop-blur-md border border-border flex items-center justify-center text-heading hover:bg-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow hover:border-divider"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-warning animate-in spin-in-12 duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-primary animate-in spin-in-12 duration-300" />
      )}
    </button>
  );
}
