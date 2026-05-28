export function QuickNoteShortcutHelp() {
  return (
    <div className="rounded-md border border-border bg-card/60 p-2 text-[11px] text-muted-foreground">
      You can type commands directly in the title:
      <div className="mt-1 flex flex-wrap gap-1">
        <code className="rounded bg-accent px-1">#tag</code> add a tag
        <code className="rounded bg-accent px-1">@room_name</code> set room
        <code className="rounded bg-accent px-1">room:Entrance_Hall</code> set room
        <code className="rounded bg-accent px-1">!clue</code> /
        <code className="rounded bg-accent px-1">!code</code> /
        <code className="rounded bg-accent px-1">!todo</code> set type
        <code className="rounded bg-accent px-1">this-run</code> or
        <code className="rounded bg-accent px-1">cross-run</code> set scope
        <code className="rounded bg-accent px-1">high</code> /
        <code className="rounded bg-accent px-1">low</code> priority
      </div>
    </div>
  );
}
