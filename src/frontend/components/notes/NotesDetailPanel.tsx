import type { Note } from "@/lib/types";
import { GhostButton } from "@/frontend/components/common/button";
import { NoteRowEditor } from "@/frontend/components/note-row/NoteRowEditor";
import { NoteRowDetails } from "@/frontend/components/note-row/NoteRowDetails";
import { SidebarPanel } from "@/frontend/components/common/sidebar-panel";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/common/dialog";

export function NotesDetailPanel({
  activeNote,
  draft,
  panelMode,
  setDraft,
  onSave,
  onClose,
  onSwitchToEdit,
}: {
  activeNote: Note | null;
  draft: Note | null;
  panelMode: "edit" | "preview";
  setDraft: React.Dispatch<React.SetStateAction<Note>>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onSwitchToEdit?: () => void;
}) {
  return (
    <SidebarPanel open={!!activeNote} onClose={onClose} className="notes-view-panel">
      {activeNote && (
        <>
          <DialogHeader className="shrink-0 space-y-0">
            {panelMode === "edit" ? (
              <DialogTitle className="font-serif text-lg">Edit note</DialogTitle>
            ) : (
              <>
                <DialogTitle className="font-serif text-xl">{activeNote.title}</DialogTitle>
                <DialogDescription>Note preview</DialogDescription>
              </>
            )}
          </DialogHeader>

          <div className="min-h-0">
            {panelMode === "edit" ? (
              <NoteRowEditor
                draft={draft ?? activeNote}
                setDraft={setDraft}
                onSave={onSave}
                onCancel={onClose}
              />
            ) : (
              <>
                <div className="notes-panel-preview-scroll">
                  <NoteRowDetails note={activeNote} />
                </div>
                <div className="notes-panel-preview-footer">
                  <GhostButton onClick={onClose}>Close</GhostButton>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </SidebarPanel>
  );
}
