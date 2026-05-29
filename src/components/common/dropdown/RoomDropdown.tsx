/**
 * RoomDropdown — room picker with live search and grouped sub-menus by category.
 * Rooms are grouped under sub-menus (e.g. Ground Floor, Upper Floor) when not filtering.
 * Typing in the search box flattens results across all groups.
 */

import { memo, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/common/dropdown/DropdownMenu";
import { addCustomRoom, getAllRoomGroups, getGroupedRoomCatalog } from "@/data/rooms";

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

function RoomDropdownComponent({
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
  const [query, setQuery] = useState("");
  const [catalogVersion, setCatalogVersion] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const { groupedRooms, allGroups } = useMemo(() => {
    // catalogVersion is intentionally used to bust the module-level cache after
    // addCustomRoom mutates localStorage (the functions read fresh data each call).
    void catalogVersion;
    return { groupedRooms: getGroupedRoomCatalog(), allGroups: getAllRoomGroups() };
  }, [catalogVersion]);
  const roomCategoryByName = useMemo(() => {
    const map = new Map<string, string>();
    allGroups.forEach((group) => {
      groupedRooms[group]?.forEach((room) => {
        if (!map.has(room.name)) map.set(room.name, group);
      });
    });
    return map;
  }, [groupedRooms, allGroups]);

  const activeRoom = value?.trim() ? value.trim() : "";
  const activeCategory = activeRoom ? (roomCategoryByName.get(activeRoom) ?? null) : null;

  // Slash syntax: "group/room" scopes the search and sets the target group for new rooms.
  const slashIdx = query.indexOf("/");
  const hasSlash = slashIdx !== -1;
  const groupRaw = hasSlash ? query.slice(0, slashIdx).trim() : "";
  const roomRaw = hasSlash ? query.slice(slashIdx + 1).trim() : query.trim();
  const groupQuery = groupRaw.toLowerCase();
  const roomQuery = roomRaw.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();

  const searchResults: Array<{ name: string; category: string }> = [];
  if (normalizedQuery) {
    allGroups.forEach((group) => {
      if (hasSlash && groupQuery && !group.toLowerCase().includes(groupQuery)) return;
      const term = hasSlash ? roomQuery : normalizedQuery;
      groupedRooms[group]?.forEach((room) => {
        if (!term || room.name.toLowerCase().includes(term)) {
          searchResults.push({ name: room.name, category: group });
        }
      });
    });
  }

  const targetGroup = hasSlash ? toTitleCase(groupRaw) || "Custom Rooms" : "Custom Rooms";
  const targetRoom = roomRaw;
  const exactMatchExists = targetRoom
    ? allGroups.some((g) =>
        groupedRooms[g]?.some((r) => r.name.toLowerCase() === targetRoom.toLowerCase()),
      )
    : true;
  const showAddOption = targetRoom.length > 0 && !exactMatchExists;

  function handleAddCustomRoom() {
    if (!targetRoom) return;
    addCustomRoom(targetRoom, targetGroup);
    setCatalogVersion((v) => v + 1);
    onValueChange(targetRoom);
  }

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setQuery("");
        if (nextOpen) requestAnimationFrame(() => searchRef.current?.focus());
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
            ref={searchRef}
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
          <>
            {searchResults.map((room) => (
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
            ))}
            {showAddOption ? (
              <DropdownMenuItem onSelect={handleAddCustomRoom} className="text-muted-foreground">
                <Plus className="mr-2 h-4 w-4 shrink-0" />
                Add "{targetRoom}" to {targetGroup}
              </DropdownMenuItem>
            ) : searchResults.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No matching rooms</div>
            ) : null}
          </>
        ) : (
          allGroups
            .filter((group) => (groupedRooms[group]?.length ?? 0) > 0)
            .map((group) => (
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
                  {groupedRooms[group]?.map((room) => (
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

export const RoomDropdown = memo(RoomDropdownComponent);
