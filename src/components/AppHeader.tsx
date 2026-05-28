import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Settings as SettingsIcon,
  Download,
  Upload,
  FolderSync,
  Coffee,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "@/data/store";
import { exportAll, importAll } from "@/data/io";
import { INPUT_BASE_CLASS } from "@/components/common/formClasses";
import { Button, IconButton } from "@/components/common/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";

export function AppHeader() {
  const buyMeACoffeeUrl = "https://buymeacoffee.com/fredrikm97";
  const sections = useStore((s) => s.sections);
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const openCapture = useStore((s) => s.openCapture);
  const captureOpen = useStore((s) => s.captureOpen);
  const closeCapture = useStore((s) => s.closeCapture);
  const load = useStore((s) => s.load);
  const syncFolderName = useStore((s) => s.syncFolderName);
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
      closeCapture();
    }
  }, [captureOpen, canCreateInPlace, closeCapture]);

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
      openCapture({
        kind: "note",
        noteType: defaultCaptureNoteType,
        returnTo: canCreateInPlace ? undefined : pathname,
      });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCapture, canCreateInPlace, defaultCaptureNoteType, navigate, pathname]);

  function hrefFor(s: { id: string; builtin?: string; filter?: { type?: string } }) {
    if (s.builtin === "notes") return "/";
    return `/section/${s.id}`;
  }

  function openWelcomeScreen() {
    window.dispatchEvent(new CustomEvent("bp:show-welcome"));
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-brand-link" onClick={openWelcomeScreen}>
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
          {syncFolderName && (
            <Link
              to="/settings"
              title={`Syncing to "${syncFolderName}"`}
              className="hidden items-center gap-1.5 text-xs text-green-500 sm:flex"
            >
              <FolderSync className="h-3.5 w-3.5" />
              <span className="max-w-[10rem] truncate">{syncFolderName}</span>
            </Link>
          )}
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
              openCapture({
                kind: "note",
                noteType: defaultCaptureNoteType,
                returnTo: canCreateInPlace ? undefined : pathname,
              });
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
                <a href={buyMeACoffeeUrl} target="_blank" rel="noreferrer">
                  <Coffee className="app-menu-icon" /> Buy me a coffee
                </a>
              </DropdownMenuItem>
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
