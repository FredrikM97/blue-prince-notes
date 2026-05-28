import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, createRoute, createRouter } from "@tanstack/react-router";
import appCss from "./styles.css?url";
import {
  ErrorView,
  NotesIndexView,
  NotFoundView,
  RootLayoutView,
  RootShellView,
  SectionView,
} from "@/frontend/router-views";
import { SettingsPage } from "@/frontend/components/settings/SettingsPage";

type RouterContext = {
  queryClient: QueryClient;
};

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
