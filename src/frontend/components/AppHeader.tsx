import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Plus, Settings as SettingsIcon, Download, Upload } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "@/frontend/data/store";
import { exportAll, importAll } from "@/frontend/data/io";
import { INPUT_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { Button, IconButton } from "@/frontend/components/common/button";
import { ThemeToggle } from "@/frontend/components/common/ThemeToggle";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/common/DropdownMenu";

export function AppHeader() {
  const sections = useStore((s) => s.sections);
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const openCapture = useStore((s) => s.openCapture);
  const captureOpen = useStore((s) => s.captureOpen);
  const load = useStore((s) => s.load);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeSection = useMemo(() => {
    const match = pathname.match(/^\/section\/([^/]+)$/);
    if (!match) return null;
    const sectionId = decodeURIComponent(match[1]);
    return sections.find((s) => s.id === sectionId) ?? null;
  }, [pathname, sections]);

  const canCreateInPlace =
    pathname === "/" ||
    (pathname.startsWith("/section/") && (!activeSection || !activeSection.builtin));

  const defaultCaptureNoteType = activeSection?.filter?.type;

  useEffect(() => {
    if (captureOpen && !canCreateInPlace) {
      void navigate({ to: "/" });
    }
  }, [captureOpen, canCreateInPlace, navigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement;
      const typing = tgt && /input|textarea|select/i.test(tgt.tagName);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "n" && e.key !== "N" && e.key !== "+") return;
      e.preventDefault();
      if (!canCreateInPlace) {
        void navigate({ to: "/" });
      }
      openCapture({ kind: "note", noteType: defaultCaptureNoteType });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCapture, canCreateInPlace, defaultCaptureNoteType, navigate]);

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
          <ThemeToggle />
          <div className="app-search-wrap">
            <Search className="app-search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=""
              aria-label="Search notes"
              className={`${INPUT_BASE_CLASS} app-search-input`}
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (!canCreateInPlace) {
                void navigate({ to: "/" });
              }
              openCapture({ kind: "note", noteType: defaultCaptureNoteType });
            }}
            className="app-add-button"
          >
            <Plus className="app-add-icon" />
            <span>Add note</span>
            <kbd className="app-add-shortcut">N</kbd>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton className="app-icon-button" aria-label="Settings">
                <SettingsIcon className="app-icon-sm" />
              </IconButton>
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
