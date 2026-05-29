import { useState } from "react";
import type { Priority, Todo } from "@/lib/types";
import { useStore } from "@/data/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/Dialog";
import { GhostButton, BrassButton } from "@/components/common/Button";
import { RoomDropdown } from "@/components/common/dropdown/RoomDropdown";
import { DropdownSelect } from "@/components/common/dropdown/DropdownSelect";
import { INPUT_BASE_CLASS } from "@/components/common/FormClasses";
import { toast } from "sonner";

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "med", label: "Medium" },
  { value: "low", label: "Low" },
];

const SCOPE_OPTIONS = [
  { value: "this-run", label: "This run" },
  { value: "cross-run", label: "Cross-run" },
  { value: "someday", label: "Someday" },
];

function parseTags(raw: string) {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
}

export function TodoEditDialog({
  todo,
  open,
  onOpenChange,
  onSaved,
}: {
  todo: Todo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const saveTodo = useStore((s) => s.saveTodo);

  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes ?? "");
  const [priority, setPriority] = useState<Priority>(todo.priority);
  const [room, setRoom] = useState(todo.room ?? "");
  const [tagsInput, setTagsInput] = useState(todo.tags.join(", "));
  const [scope, setScope] = useState(todo.scope);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    await saveTodo({
      ...todo,
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      room: room || undefined,
      tags: parseTags(tagsInput),
      scope: scope as Todo["scope"],
    });
    toast.success("Todo updated");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit todo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="capture-label">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
              className={`${INPUT_BASE_CLASS} h-10`}
            />
          </div>

          <div>
            <label className="capture-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Details about this todo…"
              className={`${INPUT_BASE_CLASS} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="capture-label">Priority</label>
              <DropdownSelect
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
                options={PRIORITY_OPTIONS}
              />
            </div>
            <div>
              <label className="capture-label">Scope</label>
              <DropdownSelect
                value={scope}
                onValueChange={(v) => setScope(v as Todo["scope"])}
                options={SCOPE_OPTIONS}
              />
            </div>
          </div>

          <div>
            <label className="capture-label">Room</label>
            <RoomDropdown value={room} onValueChange={setRoom} />
          </div>

          <div>
            <label className="capture-label">Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="safe, gem, puzzle"
              className={INPUT_BASE_CLASS}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <GhostButton onClick={() => onOpenChange(false)}>Cancel</GhostButton>
          <BrassButton onClick={() => void handleSave()}>Save</BrassButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
