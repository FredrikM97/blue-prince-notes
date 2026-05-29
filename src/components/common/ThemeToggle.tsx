import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/common/Button";

type Theme = "light" | "dark";

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("bp-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem("bp-theme", theme);
}

/** Self-contained theme toggle. Manages its own state, reads/writes localStorage,
 *  and applies the `dark` class to <html>. No external state needed. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <IconButton
      onClick={toggle}
      className="app-icon-button"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
    >
      {theme === "dark" ? <Sun className="app-icon-sm" /> : <Moon className="app-icon-sm" />}
    </IconButton>
  );
}
