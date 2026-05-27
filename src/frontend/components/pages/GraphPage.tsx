import { useMemo } from "react";
import { useStore } from "@/frontend/data/store";
import { DEFAULT_ROOMS } from "@/frontend/data/rooms";
import type { Note } from "@/lib/types";

interface GraphNode {
  id: string;
  x: number;
  y: number;
  note: Note;
}

interface GraphEdge {
  a: string;
  b: string;
  weight: number;
}

const TYPE_COLOR: Record<Note["type"], string> = {
  clue: "#f7c56e",
  code: "#8cc8ff",
  observation: "#9de6b0",
  theory: "#d8b3ff",
  book: "#f4a7a7",
  task: "#f0e68c",
};

export function GraphPage() {
  const notes = useStore((s) => s.notes);

  const { nodes, edges } = useMemo(() => buildGraph(notes), [notes]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-2xl">Connections</h1>
          <p className="text-xs text-muted-foreground">
            Notes connect when they share a room, tag, or attached image.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {nodes.length} notes · {edges.length} links
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No notes yet. Add notes to build your connection graph.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card/40 p-2">
          <svg viewBox="0 0 1000 680" className="h-[68vh] min-h-[420px] w-full">
            <rect x="0" y="0" width="1000" height="680" fill="transparent" />

            {edges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.a);
              const to = nodes.find((n) => n.id === edge.b);
              if (!from || !to) return null;
              return (
                <line
                  key={`${edge.a}-${edge.b}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={Math.min(1 + edge.weight * 0.4, 3)}
                />
              );
            })}

            {nodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={11}
                  fill={TYPE_COLOR[node.note.type]}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth={1}
                >
                  <title>{node.note.title}</title>
                </circle>
                <text
                  x={node.x + 14}
                  y={node.y + 4}
                  fill="rgba(255,255,255,0.86)"
                  fontSize="11"
                >
                  {trim(node.note.title, 24)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

function buildGraph(notes: Note[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (notes.length === 0) return { nodes: [], edges: [] };

  const knownRooms = new Set<string>(DEFAULT_ROOMS.map((r) => normalizeRoom(r.name)));
  notes.forEach((note) => {
    if (note.room) knownRooms.add(normalizeRoom(note.room));
  });

  const signals = new Map<string, { tags: Set<string>; rooms: Set<string>; images: Set<string> }>();
  notes.forEach((note) => {
    signals.set(note.id, extractSignals(note, knownRooms));
  });

  const centerX = 500;
  const centerY = 340;
  const radius = 250;

  const nodes = notes.map((note, i) => {
    const angle = (2 * Math.PI * i) / Math.max(notes.length, 1);
    const wobble = (hashId(note.id) % 40) - 20;
    return {
      id: note.id,
      note,
      x: centerX + Math.cos(angle) * (radius + wobble),
      y: centerY + Math.sin(angle) * (radius + wobble),
    };
  });

  const edges: GraphEdge[] = [];

  for (let i = 0; i < notes.length; i += 1) {
    for (let j = i + 1; j < notes.length; j += 1) {
      const a = notes[i];
      const b = notes[j];

      const sigA = signals.get(a.id);
      const sigB = signals.get(b.id);
      if (!sigA || !sigB) continue;

      const sharedTags = intersectCount(sigA.tags, sigB.tags);
      const sharedRoom = intersectCount(sigA.rooms, sigB.rooms);
      const sharedImages = intersectCount(sigA.images, sigB.images);
      const weight = sharedTags + sharedRoom + sharedImages;

      if (weight > 0) {
        edges.push({ a: a.id, b: b.id, weight });
      }
    }
  }

  return { nodes, edges };
}

function extractSignals(
  note: Note,
  knownRooms: Set<string>,
): { tags: Set<string>; rooms: Set<string>; images: Set<string> } {
  const tags = new Set<string>(note.tags.map((t) => normalizeTag(t)));
  const rooms = new Set<string>();
  const images = new Set<string>(note.imageIds);

  if (note.room) rooms.add(normalizeRoom(note.room));

  const raw = `${note.title} ${note.body}`;
  const lowered = raw.toLowerCase();

  // #tag references in title/details.
  const hashMatches = raw.match(/#[\w-]+/g) ?? [];
  hashMatches.forEach((tok) => tags.add(normalizeTag(tok.slice(1))));

  // @room_name references in title/details.
  const roomMatches = raw.match(/@[\w-]+/g) ?? [];
  roomMatches.forEach((tok) => rooms.add(normalizeRoom(tok.slice(1).replace(/_/g, " "))));

  // Mentioned room names in free text details.
  knownRooms.forEach((room) => {
    if (room && lowered.includes(room)) rooms.add(room);
  });

  return { tags, rooms, images };
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

function normalizeRoom(value: string) {
  return value.trim().toLowerCase().replace(/_/g, " ");
}

function intersectCount(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const value of a) {
    if (b.has(value)) count += 1;
  }
  return count;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function trim(value: string, len: number) {
  if (value.length <= len) return value;
  return `${value.slice(0, len - 1)}…`;
}
