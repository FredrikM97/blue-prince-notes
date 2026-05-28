import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Link, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/common/sonner";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { NotesPage } from "@/components/notes/NotesPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { TodosPage } from "@/components/todos/TodosPage";
import { MapPage } from "@/components/map/MapPage";
import { ImagesPage } from "@/components/images/ImagesPage";
import { GraphPage } from "@/components/graph/GraphPage";
import { useStore } from "@/data/store";
import {
  restoreSyncHandle,
  readFromSyncFolder,
  importSyncManifest,
  getActiveSyncFolderName,
} from "@/data/sync";

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
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const setSyncFolderName = useStore((s) => s.setSyncFolderName);

  // Three-state: "checking" while async init runs, then "welcome" or "ready"
  const [initState, setInitState] = useState<"checking" | "welcome" | "ready">("checking");
  const [welcomeSource, setWelcomeSource] = useState<"auto" | "manual" | null>(null);

  useEffect(() => {
    async function init() {
      // 1. Load IndexedDB data
      await load();

      // 2. Try to restore a previously chosen sync folder
      const handle = await restoreSyncHandle();
      if (handle) {
        setSyncFolderName(getActiveSyncFolderName() ?? handle.name);
        // If IndexedDB is empty, import from the folder
        const state = useStore.getState();
        if (state.notes.length === 0 && state.todos.length === 0) {
          const manifest = await readFromSyncFolder(handle);
          if (manifest) {
            await importSyncManifest(manifest);
            await load();
          }
        }
      }

      // 3. Decide whether to show the welcome screen
      const welcomed = localStorage.getItem("bp-welcomed") === "1";
      const state = useStore.getState();
      const hasData = state.notes.length > 0 || state.todos.length > 0;
      const hasSyncFolder = Boolean(getActiveSyncFolderName());

      if (!welcomed && !hasData && !hasSyncFolder) {
        setWelcomeSource("auto");
        setInitState("welcome");
      } else {
        localStorage.setItem("bp-welcomed", "1");
        setWelcomeSource(null);
        setInitState("ready");
      }
    }

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function showWelcome() {
      setWelcomeSource("manual");
      setInitState("welcome");
    }
    window.addEventListener("bp:show-welcome", showWelcome);
    return () => window.removeEventListener("bp:show-welcome", showWelcome);
  }, []);

  // Also mark ready whenever data appears (e.g. user creates first note)
  useEffect(() => {
    if (
      initState === "welcome" &&
      welcomeSource === "auto" &&
      (notes.length > 0 || todos.length > 0)
    ) {
      localStorage.setItem("bp-welcomed", "1");
      setWelcomeSource(null);
      setInitState("ready");
    }
  }, [notes.length, todos.length, initState, welcomeSource]);

  if (!loaded && initState === "checking") {
    // Silent loading — no spinner to avoid flash
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <AppHeader />
        <Toaster />
      </div>
    );
  }

  if (initState === "welcome") {
    const hasExistingConfiguration =
      notes.length > 0 || todos.length > 0 || Boolean(getActiveSyncFolderName());

    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <AppHeader />
        <div className="min-h-0 flex-1 overflow-auto">
          <WelcomeScreen
            showContinueSuggestion={hasExistingConfiguration}
            onContinue={() => {
              setWelcomeSource(null);
              setInitState("ready");
            }}
            onDone={(folderName) => {
              if (folderName) setSyncFolderName(folderName);
              localStorage.setItem("bp-welcomed", "1");
              setWelcomeSource(null);
              setInitState("ready");
            }}
          />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <AppHeader />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
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
