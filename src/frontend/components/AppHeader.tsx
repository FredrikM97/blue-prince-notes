import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Plus, Settings as SettingsIcon, Download, Upload, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/frontend/data/store";
import { exportAll, importAll } from "@/frontend/data/io";
import { INPUT_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";

export function AppHeader() {
  const sections = useStore((s) => s.sections);
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const openCapture = useStore((s) => s.openCapture);
  const closeCapture = useStore((s) => s.closeCapture);
  const load = useStore((s) => s.load);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const fileRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    closeCapture();
  }, [pathname, closeCapture]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bp-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("bp-theme", next);
  }

  function hrefFor(s: { id: string; builtin?: string; filter?: { type?: string } }) {
    if (s.builtin === "notes") return "/";
    return `/section/${s.id}`;
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-brand-link">
          <span className="app-brand-badge">B</span>
          <span className="app-brand-title">Blue Prince Notes</span>
        </Link>

        <nav className="app-nav">
          {sections
            .filter((s) => !s.hidden && (Boolean(s.builtin) || s.id === "books"))
            .map((s) => {
              const href = hrefFor(s);
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={s.id}
                  to={href}
                  className={`app-nav-link ${active ? "app-nav-link-active" : ""}`}
                >
                  {s.label}
                </Link>
              );
            })}
        </nav>

        <div className="app-header-controls">
          <button
            onClick={toggleTheme}
            className={buttonClass({
              variant: "ghost",
              size: "icon",
              className: "app-icon-button",
            })}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun className="app-icon-sm" /> : <Moon className="app-icon-sm" />}
          </button>
          <div className="app-search-wrap">
            <Search className="app-search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className={`${INPUT_BASE_CLASS} app-search-input`}
            />
          </div>
          <button
            onClick={() => openCapture()}
            className={buttonClass({
              size: "sm",
              className: "app-add-button",
            })}
          >
            <Plus className="app-add-icon" />
            <span>Add note</span>
            <kbd className="app-add-shortcut">N</kbd>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={buttonClass({
                  variant: "ghost",
                  size: "icon",
                  className: "app-icon-button",
                })}
                aria-label="Settings"
              >
                <SettingsIcon className="app-icon-sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAll().then(() => toast.success("Exported"))}>
                <Download className="app-menu-icon" /> Export all (ZIP)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                <Upload className="app-menu-icon" /> Import…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <SettingsIcon className="app-menu-icon" /> Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip,application/json,.json"
            className="app-hidden-file-input"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                await importAll(f, "merge");
                await load();
                toast.success("Imported");
              } catch (err) {
                toast.error((err as Error).message);
              }
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </header>
  );
}
