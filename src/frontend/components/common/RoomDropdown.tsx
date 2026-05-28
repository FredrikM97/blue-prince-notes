import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/frontend/components/common/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/frontend/components/common/DropdownMenu";
import { getGroupedRoomCatalog, ROOM_GROUPS, type RoomCategory } from "@/frontend/data/rooms";

export function RoomDropdown({
  value,
  onValueChange,
  placeholder = "Pick a room...",
  clearLabel = "No room",
}: {
  value?: string;
  onValueChange: (next: string) => void;
  placeholder?: string;
  clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const groupedRooms = getGroupedRoomCatalog();
  const roomCategoryByName = new Map<string, RoomCategory>();
  ROOM_GROUPS.forEach((group) => {
    groupedRooms[group].forEach((room) => {
      if (!roomCategoryByName.has(room.name)) {
        roomCategoryByName.set(room.name, group);
      }
    });
  });

  const activeRoom = value?.trim() ? value.trim() : "";
  const activeCategory = activeRoom ? (roomCategoryByName.get(activeRoom) ?? null) : null;
  const normalizedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];

    const matches: Array<{ name: string; category: RoomCategory }> = [];
    ROOM_GROUPS.forEach((group) => {
      groupedRooms[group].forEach((room) => {
        if (room.name.toLowerCase().includes(normalizedQuery)) {
          matches.push({ name: room.name, category: group });
        }
      });
    });
    return matches;
  }, [groupedRooms, normalizedQuery]);

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between bg-card/65 px-3 py-2 text-sm font-normal"
        >
          <span className={activeRoom ? "text-foreground" : "text-muted-foreground"}>
            {activeRoom || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <div className="px-1 pb-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Search rooms..."
            className="h-8 w-full rounded border border-input bg-card/65 px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <DropdownMenuItem
          className={!activeRoom ? "bg-accent" : undefined}
          onSelect={() => onValueChange("")}
        >
          {clearLabel}
        </DropdownMenuItem>

        {normalizedQuery ? (
          searchResults.length > 0 ? (
            searchResults.map((room) => (
              <DropdownMenuItem
                key={`${room.category}-${room.name}`}
                className={room.name === activeRoom ? "bg-accent" : undefined}
                onSelect={() => onValueChange(room.name)}
              >
                <div className="flex min-w-0 flex-col">
                  <span>{room.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{room.category}</span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No matching rooms</div>
          )
        ) : (
          ROOM_GROUPS.map((group) => (
            <DropdownMenuSub key={group}>
              <DropdownMenuSubTrigger>
                <div className="flex min-w-0 flex-col">
                  <span>{group}</span>
                  {activeCategory === group && activeRoom && (
                    <span className="truncate text-xs text-muted-foreground">{activeRoom}</span>
                  )}
                </div>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent className="max-h-72 min-w-56">
                {groupedRooms[group].map((room) => (
                  <DropdownMenuItem
                    key={room.name}
                    className={room.name === activeRoom ? "bg-accent" : undefined}
                    onSelect={() => onValueChange(room.name)}
                  >
                    {room.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
