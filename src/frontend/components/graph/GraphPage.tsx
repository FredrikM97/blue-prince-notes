import { useMemo } from "react";
import { EmptyState } from "@/frontend/components/common/EmptyState";
import { PageLayout } from "@/frontend/components/common/PageLayout";
import { useStore } from "@/frontend/data/store";
import type { Note } from "@/lib/types";

const GRAPH_VIEWBOX = "0 0 1000 680";
const LAYOUT_CENTER_X = 500;
const LAYOUT_CENTER_Y = 340;
const LAYOUT_RADIUS = 250;
const NODE_RADIUS = 11;
const EDGE_NODE_PADDING = 14;

interface GraphNode {
  id: string;
  x: number;
  y: number;
  note: Note;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  relations: string[];
}

interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface ReferenceSignals {
  tags: Set<string>;
  rooms: Set<string>;
}

interface OwnerSignals {
  tags: Set<string>;
  room: string | null;
}

interface LineGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mx: number;
  my: number;
}

const TYPE_COLOR: Record<Note["type"], string> = {
  clue: "#f7c56e",
  code: "#8cc8ff",
  observation: "#9de6b0",
  theory: "#d8b3ff",
  story: "#f4a7a7",
  task: "#f0e68c",
};

export function GraphPage() {
  const notes = useStore((s) => s.notes);

  const { nodes, edges } = useMemo(() => buildGraph(notes), [notes]);
  const nodeById = useMemo(() => indexNodes(nodes), [nodes]);

  return (
    <PageLayout>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-2xl">Connections</h1>
          <p className="text-xs text-muted-foreground">
            Arrows show explicit references: @room and #tag.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {nodes.length} notes · {edges.length} links
        </div>
      </div>

      {nodes.length === 0 ? (
        <EmptyState>No notes yet. Add notes to build your connection graph.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card/40 p-2">
          <svg viewBox={GRAPH_VIEWBOX} className="h-[68vh] min-h-[420px] w-full">
            <rect x="0" y="0" width="1000" height="680" fill="transparent" />
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.45)" />
              </marker>
            </defs>

            {edges.map((edge) => renderEdge(edge, nodeById))}

            {nodes.map(renderNode)}
          </svg>
        </div>
      )}
    </PageLayout>
  );
}

function buildGraph(notes: Note[]): GraphModel {
  if (notes.length === 0) return { nodes: [], edges: [] };

  const refs = buildReferenceSignals(notes);
  const owners = buildOwnerSignals(notes);

  return {
    nodes: buildNodes(notes),
    edges: buildEdges(notes, refs, owners),
  };
}

function buildNodes(notes: Note[]): GraphNode[] {
  return notes.map((note, i) => {
    const angle = (2 * Math.PI * i) / Math.max(notes.length, 1);
    const wobble = (hashId(note.id) % 40) - 20;
    return {
      id: note.id,
      note,
      x: LAYOUT_CENTER_X + Math.cos(angle) * (LAYOUT_RADIUS + wobble),
      y: LAYOUT_CENTER_Y + Math.sin(angle) * (LAYOUT_RADIUS + wobble),
    };
  });
}

function buildReferenceSignals(notes: Note[]): Map<string, ReferenceSignals> {
  const refs = new Map<string, ReferenceSignals>();
  notes.forEach((note) => {
    refs.set(note.id, extractReferences(note));
  });
  return refs;
}

function buildOwnerSignals(notes: Note[]): Map<string, OwnerSignals> {
  const owners = new Map<string, OwnerSignals>();
  notes.forEach((note) => {
    owners.set(note.id, {
      tags: new Set<string>(note.tags.map((t) => normalizeTag(t))),
      room: note.room ? normalizeRoom(note.room) : null,
    });
  });
  return owners;
}

function buildEdges(
  notes: Note[],
  refs: Map<string, ReferenceSignals>,
  owners: Map<string, OwnerSignals>,
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (let i = 0; i < notes.length; i += 1) {
    const source = notes[i];
    const sourceRefs = refs.get(source.id);
    if (!sourceRefs) continue;

    for (let j = 0; j < notes.length; j += 1) {
      if (i === j) continue;

      const target = notes[j];
      const targetOwner = owners.get(target.id);
      if (!targetOwner) continue;

      const edge = buildDirectedEdge(source.id, target.id, sourceRefs, targetOwner);
      if (edge) edges.push(edge);
    }
  }

  return edges;
}

function buildDirectedEdge(
  sourceId: string,
  targetId: string,
  sourceRefs: ReferenceSignals,
  targetOwner: OwnerSignals,
): GraphEdge | null {
  let weight = 0;
  const relations: string[] = [];

  if (targetOwner.room && sourceRefs.rooms.has(targetOwner.room)) {
    weight += 1;
    relations.push("room");
  }

  const sharedTags = intersectCount(sourceRefs.tags, targetOwner.tags);
  if (sharedTags > 0) {
    weight += Math.min(sharedTags, 2);
    relations.push("tag");
  }

  if (weight === 0) return null;
  return { from: sourceId, to: targetId, weight, relations };
}

function extractReferences(note: Note): ReferenceSignals {
  const tags = new Set<string>();
  const rooms = new Set<string>();

  const raw = `${note.title} ${note.body}`;

  // Explicit #tag references in title/details.
  const hashMatches = raw.match(/#[\w-]+/g) ?? [];
  hashMatches.forEach((tok) => tags.add(normalizeTag(tok.slice(1))));

  // Explicit @room_name references in title/details.
  const roomMatches = raw.match(/@[\w-]+/g) ?? [];
  roomMatches.forEach((tok) => rooms.add(normalizeRoom(tok.slice(1).replace(/_/g, " "))));

  return { tags, rooms };
}

function indexNodes(nodes: GraphNode[]) {
  const map = new Map<string, GraphNode>();
  nodes.forEach((node) => {
    map.set(node.id, node);
  });
  return map;
}

function renderEdge(edge: GraphEdge, nodeById: Map<string, GraphNode>) {
  const from = nodeById.get(edge.from);
  const to = nodeById.get(edge.to);
  if (!from || !to) return null;

  const line = edgeGeometry(from, to, EDGE_NODE_PADDING);

  return (
    <g key={`${edge.from}-${edge.to}`}>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={Math.min(1 + edge.weight * 0.4, 3)}
        markerEnd="url(#graph-arrow)"
      />
      <text
        x={line.mx}
        y={line.my - 4}
        fill="rgba(255,255,255,0.7)"
        fontSize="9"
        textAnchor="middle"
      >
        {edge.relations.join("+")}
      </text>
    </g>
  );
}

function renderNode(node: GraphNode) {
  return (
    <g key={node.id}>
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_RADIUS}
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
  );
}

function edgeGeometry(from: GraphNode, to: GraphNode, pad: number): LineGeometry {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;

  const x1 = from.x + (dx / distance) * pad;
  const y1 = from.y + (dy / distance) * pad;
  const x2 = to.x - (dx / distance) * pad;
  const y2 = to.y - (dy / distance) * pad;

  return {
    x1,
    y1,
    x2,
    y2,
    mx: (x1 + x2) / 2,
    my: (y1 + y2) / 2,
  };
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
