import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Link, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/frontend/components/AppHeader";
import { Button } from "@/frontend/components/common/button";
import { Toaster } from "@/frontend/components/common/sonner";
import { NotesPage } from "@/frontend/components/notes/NotesPage";
import { SettingsPage } from "@/frontend/components/settings/SettingsPage";
import { TodosPage } from "@/frontend/components/todos/TodosPage";
import { MapPage } from "@/frontend/components/map/MapPage";
import { ImagesPage } from "@/frontend/components/images/ImagesPage";
import { GraphPage } from "@/frontend/components/graph/GraphPage";
import { useStore } from "@/frontend/data/store";

export function RootShellView({ children }: { children: React.ReactNode }) {
  const themeScript =
    "try{const v=localStorage.getItem('bp-theme');const d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',v?v==='dark':d);}catch{}";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppFrame({ children }: { children: React.ReactNode }) {
  const load = useStore((s) => s.load);
  const loaded = useStore((s) => s.loaded);
  const [showBackupNotice, setShowBackupNotice] = useState(false);

  useEffect(() => {
    if (!loaded) void load();
  }, [load, loaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = window.localStorage.getItem("bp-backup-notice-dismissed") === "1";
      if (!dismissed) setShowBackupNotice(true);
    } catch {
      setShowBackupNotice(true);
    }
  }, []);

  function dismissBackupNotice() {
    setShowBackupNotice(false);
    try {
      window.localStorage.setItem("bp-backup-notice-dismissed", "1");
    } catch {
      // Ignore localStorage failures and only dismiss for the current session.
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <AppHeader />
      {showBackupNotice && (
        <div className="border-b border-brass/40 bg-brass/15">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm sm:px-4">
            <p className="text-foreground">
              Local-only storage: manually use Export all (ZIP) regularly. There is currently no
              cloud backup.
            </p>
            <Button variant="outline" size="sm" onClick={dismissBackupNotice}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden pb-20 sm:pb-32">{children}</div>
      <Toaster />
    </div>
  );
}

export function RootLayoutView({ queryClient }: { queryClient: QueryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppFrame>
        <Outlet />
      </AppFrame>
    </QueryClientProvider>
  );
}

export function NotFoundView() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl text-brass">404</h1>
        <h2 className="mt-4 font-serif text-xl">A door that doesn't open</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This room isn't on the map. Head back to the entrance hall.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex rounded-md bg-brass px-4 py-2 text-sm font-medium text-brass-foreground hover:bg-brass/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorView({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-brass-foreground hover:bg-brass/90"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesIndexView() {
  return <NotesPage title="Notes" emptyHint="No notes yet. Press N anywhere to add one." />;
}

export function SectionView({ id }: { id: string }) {
  const sections = useStore((s) => s.sections);
  const section = useMemo(() => sections.find((s) => s.id === id), [sections, id]);

  if (!section) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground">
        Section not found.
      </div>
    );
  }

  if (section.builtin === "todos") return <TodosPage />;
  if (section.builtin === "map") return <MapPage />;
  if (section.builtin === "graph") return <GraphPage />;
  if (section.builtin === "images") return <ImagesPage />;
  if (section.id === "settings") return <SettingsPage />;

  return <NotesPage filterType={section.filter?.type} title={section.label} />;
}
