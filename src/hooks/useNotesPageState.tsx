import { useCallback, useMemo, useReducer } from "react";
import type { Note, NoteType } from "@/lib/types";

interface NotesPageUiState {
  typeFilter: NoteType | null;
  roomFilter: string | null;
  tagFilter: string | null;
  statusFilter: "open" | "solved" | null;
  activeNoteId: string | null;
  panelMode: "edit" | "preview";
  draft: Note | null;
  pendingDelete: Note | null;
}

type NotesPageAction =
  | { type: "setTypeFilter"; value: NoteType | null }
  | { type: "setRoomFilter"; value: string | null }
  | { type: "setTagFilter"; value: string | null }
  | { type: "setStatusFilter"; value: "open" | "solved" | null }
  | { type: "openEdit"; note: Note }
  | { type: "openPreview"; note: Note }
  | { type: "clearSelection" }
  | { type: "setDraft"; value: Note | null }
  | { type: "setPendingDelete"; value: Note | null }
  | { type: "clearDeletedIfActive"; noteId: string };

const INITIAL_UI_STATE: NotesPageUiState = {
  typeFilter: null,
  roomFilter: null,
  tagFilter: null,
  statusFilter: null,
  activeNoteId: null,
  panelMode: "edit",
  draft: null,
  pendingDelete: null,
};

/**
 * Local reducer for notes-page UI-only state.
 */
function notesPageReducer(state: NotesPageUiState, action: NotesPageAction): NotesPageUiState {
  switch (action.type) {
    case "setTypeFilter":
      return state.typeFilter === action.value ? state : { ...state, typeFilter: action.value };
    case "setRoomFilter":
      return state.roomFilter === action.value ? state : { ...state, roomFilter: action.value };
    case "setTagFilter":
      return state.tagFilter === action.value ? state : { ...state, tagFilter: action.value };
    case "setStatusFilter":
      return state.statusFilter === action.value ? state : { ...state, statusFilter: action.value };
    case "openEdit":
      if (
        state.panelMode === "edit" &&
        state.activeNoteId === action.note.id &&
        state.draft === action.note
      ) {
        return state;
      }
      return {
        ...state,
        panelMode: "edit",
        activeNoteId: action.note.id,
        draft: action.note,
      };
    case "openPreview":
      if (
        state.panelMode === "preview" &&
        state.activeNoteId === action.note.id &&
        state.draft === action.note
      ) {
        return state;
      }
      return {
        ...state,
        panelMode: "preview",
        activeNoteId: action.note.id,
        draft: action.note,
      };
    case "clearSelection":
      return state.activeNoteId === null && state.draft === null
        ? state
        : { ...state, activeNoteId: null, draft: null };
    case "setDraft":
      return state.draft === action.value ? state : { ...state, draft: action.value };
    case "setPendingDelete":
      return state.pendingDelete === action.value
        ? state
        : { ...state, pendingDelete: action.value };
    case "clearDeletedIfActive":
      return state.activeNoteId === action.noteId ? { ...state, activeNoteId: null } : state;
    default:
      return state;
  }
}

/**
 * Encapsulates notes-page reducer state and stable action creators.
 */
export function useNotesPageState() {
  const [state, dispatch] = useReducer(notesPageReducer, INITIAL_UI_STATE);

  const setTypeFilter = useCallback(
    (value: NoteType | null) => dispatch({ type: "setTypeFilter", value }),
    [],
  );
  const setRoomFilter = useCallback(
    (value: string | null) => dispatch({ type: "setRoomFilter", value }),
    [],
  );
  const setTagFilter = useCallback(
    (value: string | null) => dispatch({ type: "setTagFilter", value }),
    [],
  );
  const setStatusFilter = useCallback(
    (value: "open" | "solved" | null) => dispatch({ type: "setStatusFilter", value }),
    [],
  );
  const openEdit = useCallback((note: Note) => dispatch({ type: "openEdit", note }), []);
  const openPreview = useCallback((note: Note) => dispatch({ type: "openPreview", note }), []);
  const clearSelection = useCallback(() => dispatch({ type: "clearSelection" }), []);
  const setDraft = useCallback((value: Note | null) => dispatch({ type: "setDraft", value }), []);
  const setPendingDelete = useCallback(
    (value: Note | null) => dispatch({ type: "setPendingDelete", value }),
    [],
  );
  const clearDeletedIfActive = useCallback(
    (noteId: string) => dispatch({ type: "clearDeletedIfActive", noteId }),
    [],
  );

  const actions = useMemo(
    () => ({
      setTypeFilter,
      setRoomFilter,
      setTagFilter,
      setStatusFilter,
      openEdit,
      openPreview,
      clearSelection,
      setDraft,
      setPendingDelete,
      clearDeletedIfActive,
    }),
    [
      setTypeFilter,
      setRoomFilter,
      setTagFilter,
      setStatusFilter,
      openEdit,
      openPreview,
      clearSelection,
      setDraft,
      setPendingDelete,
      clearDeletedIfActive,
    ],
  );

  return { state, actions };
}
