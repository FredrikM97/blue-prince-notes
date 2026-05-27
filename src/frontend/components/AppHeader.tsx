import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Plus, Settings as SettingsIcon, Download, Upload } from "lucide-react";
import { useEffect, useRef } from "react";
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
  const load = useStore((s) => s.load);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const fileRef = useRef<HTMLInputElement>(null);

  function hrefFor(s: { id: string; builtin?: string; filter?: { type?: string } }) {
    if (s.builtin === "notes") return "/";
    return `/section/${s.id}`;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brass text-brass-foreground font-serif text-lg font-semibold">
            B
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight">
            Blue Prince Notes
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections
            .filter((s) => !s.hidden && (Boolean(s.builtin) || s.id === "books"))
            .map((s) => {
              const href = hrefFor(s);
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={s.id}
                  to={href}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-accent text-brass"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className={`${INPUT_BASE_CLASS} h-9 w-48 pl-8`}
            />
          </div>
          <button
            onClick={() => openCapture()}
            className={buttonClass({
              size: "sm",
              className: "bg-brass text-brass-foreground hover:bg-brass/90",
            })}
          >
            <Plus className="mr-1 h-4 w-4" />
            <span>Add note</span>
            <kbd className="ml-2 rounded bg-black/20 px-1 text-[10px]">N</kbd>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={buttonClass({ variant: "ghost", size: "icon" })} aria-label="Settings">
                <SettingsIcon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAll().then(() => toast.success("Exported"))}>
                <Download className="mr-2 h-4 w-4" /> Export all (ZIP)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Import…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip,application/json,.json"
            className="hidden"
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
