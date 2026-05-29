import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import appCss from "../styles.css?url";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/common/Sonner";
import { toast } from "sonner";
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

type RouterContext = {
  queryClient: QueryClient;
};

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

  const [initState, setInitState] = useState<"checking" | "welcome" | "ready">("checking");
  const [welcomeSource, setWelcomeSource] = useState<"auto" | "manual" | null>(null);

  useEffect(() => {
    async function init() {
      await load();

      const handle = await restoreSyncHandle();
      if (handle) {
        setSyncFolderName(getActiveSyncFolderName() ?? handle.name);
        const state = useStore.getState();
        if (state.notes.length === 0 && state.todos.length === 0) {
          const manifest = await readFromSyncFolder(handle);
          if (manifest) {
            await importSyncManifest(manifest);
            await load();
          }
        }
      }

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

  // When a new version of the app is deployed, chunk URLs change. Instead of
  // crashing or silently breaking, show a persistent notification so users can
  // reload at their own convenience.
  useEffect(() => {
    function onPreloadError(e: Event) {
      e.preventDefault(); // prevent Vite from propagating the error
      toast("A new version is available", {
        description: "Reload the page to get the latest updates.",
        duration: Infinity,
        action: { label: "Reload", onClick: () => window.location.reload() },
      });
    }
    window.addEventListener("vite:preloadError", onPreloadError);
    return () => window.removeEventListener("vite:preloadError", onPreloadError);
  }, []);

  const shouldAutoDismissWelcome =
    initState === "welcome" && welcomeSource === "auto" && (notes.length > 0 || todos.length > 0);

  useEffect(() => {
    if (!shouldAutoDismissWelcome) return;
    localStorage.setItem("bp-welcomed", "1");
  }, [shouldAutoDismissWelcome]);

  const effectiveInitState = shouldAutoDismissWelcome ? "ready" : initState;

  if (!loaded && effectiveInitState === "checking") {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <AppHeader />
        <Toaster />
      </div>
    );
  }

  if (effectiveInitState === "welcome") {
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

const rootRoute = createRootRouteWithContext<RouterContext>()({
  shellComponent: RootShellView,
  component: () => <RootLayoutView queryClient={rootRoute.useRouteContext().queryClient} />,
  notFoundComponent: NotFoundView,
  errorComponent: ErrorView,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Blue Prince Notes" },
      { name: "description", content: "A keyboard-first notes & todos tracker for Blue Prince." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: NotesIndexView,
  head: () => ({
    meta: [
      { title: "Notes - Blue Prince Notes" },
      { name: "description", content: "All your Blue Prince notes, clues, codes and theories." },
    ],
  }),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "settings",
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings - Blue Prince Notes" }] }),
});

const sectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "section/$id",
  component: () => <SectionView id={sectionRoute.useParams().id} />,
  head: () => ({ meta: [{ title: "Section - Blue Prince Notes" }] }),
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute, sectionRoute]);

export const getRouter = () => {
  const queryClient = new QueryClient();
  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
};

// Alias for routeTree.gen.ts file-based routing compatibility
export { rootRoute as Route };
