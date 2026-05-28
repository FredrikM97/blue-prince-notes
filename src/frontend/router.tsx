import { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/frontend/components/AppHeader";
import { Button } from "@/frontend/components/common/button";
import { NotesPage } from "@/frontend/components/notes/NotesPage";
import { Toaster } from "@/frontend/components/common/sonner";
import { useStore } from "@/frontend/data/store";
import { SettingsPage } from "@/frontend/components/settings/SettingsPage";
import { TodosPage } from "@/frontend/components/todos/TodosPage";
import { MapPage } from "@/frontend/components/map/MapPage";
import { ImagesPage } from "@/frontend/components/images/ImagesPage";
import { GraphPage } from "@/frontend/components/graph/GraphPage";
import appCss from "./styles.css?url";

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Blue Prince Notes" },
      { name: "description", content: "A keyboard-first notes & todos tracker for Blue Prince." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <AppFrame>
      <NotFoundComponent />
    </AppFrame>
  ),
  errorComponent: ErrorComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  head: () => ({
    meta: [
      { title: "Notes — Blue Prince Notes" },
      { name: "description", content: "All your Blue Prince notes, clues, codes and theories." },
    ],
  }),
  component: () => (
    <NotesPage title="Notes" emptyHint="No notes yet. Press N anywhere to add one." />
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  head: () => ({ meta: [{ title: "Settings — Blue Prince Notes" }] }),
  component: SettingsPage,
});

const sectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/section/$id",
  head: () => ({ meta: [{ title: "Section — Blue Prince Notes" }] }),
  component: SectionPage,
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute, sectionRoute]);

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

function RootShell({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-background pb-20 text-foreground sm:pb-32">
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
      {children}
      <Toaster />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = rootRoute.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppFrame>
        <Outlet />
      </AppFrame>
    </QueryClientProvider>
  );
}

function NotFoundComponent() {
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
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

function SectionPage() {
  const { id } = sectionRoute.useParams();
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

  return <NotesPage filterType={section.filter?.type} title={section.label} />;
}
