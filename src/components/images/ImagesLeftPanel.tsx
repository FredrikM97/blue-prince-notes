import { Button } from "@/components/common/Button";

function formatLastRefreshTime(lastRefreshAt: number | null): string {
  if (!lastRefreshAt) return "Never";
  return new Date(lastRefreshAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Left sidebar panel for image page summary and Steam refresh actions.
 */
export function ImagesLeftPanel({
  total,
  steamImportActive,
  steamLastRefreshAt,
  refreshBusy,
  onRefreshSteam,
}: {
  total: number;
  steamImportActive: boolean;
  steamLastRefreshAt: number | null;
  refreshBusy: boolean;
  onRefreshSteam: () => Promise<void>;
}) {
  const refreshTime = formatLastRefreshTime(steamLastRefreshAt);

  return (
    <div className="page-layout-panel">
      <h1 className="font-serif text-2xl">Images</h1>
      <p className="mt-1 text-xs text-muted-foreground">{total} stored images</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Click an image to open details in the right panel. Use the preview button there for full
        size.
      </p>

      {steamImportActive ? (
        <div className="mt-2 space-y-1.5">
          <h2 className="font-serif text-base">Steam Images</h2>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onRefreshSteam()}
              disabled={refreshBusy}
            >
              Refresh
            </Button>
            <span
              className="text-xs text-muted-foreground"
              title={steamLastRefreshAt ? new Date(steamLastRefreshAt).toLocaleString() : "Never"}
            >
              Last refresh: {refreshTime}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
