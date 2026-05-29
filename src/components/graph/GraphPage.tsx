import { useMemo, useRef, useState, type MouseEvent, type WheelEvent } from "react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLayout } from "@/components/common/PageLayout";
import { BookOpen, Eye, Key, Lightbulb, ListTodo, Sparkles } from "lucide-react";
import { GraphRightPanel } from "@/components/graph/GraphRightPanel";
import { useGraphStoreData } from "@/hooks/useGraphStoreData";
import type { Note, Todo } from "@/lib/types";

const GRAPH_VIEWBOX = "0 0 1000 680";
const LAYOUT_CENTER_X = 500;
const LAYOUT_CENTER_Y = 340;
const CLUSTER_ORBIT_RADIUS = 210; // distance from canvas center to each cluster center
const CLUSTER_NODE_SCALE = 9;    // multiply by note count to get mini-cluster radius
const CLUSTER_MIN_NODE_RADIUS = 35;
const CLUSTER_MAX_NODE_RADIUS = 85;
const NODE_RADIUS = 13;
const EDGE_NODE_PADDING = 16;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.2;
const MIN_LABEL_SCALE = 0.6;
const MAX_LABEL_SCALE = 1.9;
const NODE_ICON_SIZE = 12;

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

interface GraphCluster {
  room: string | null;
  label: string | null;
  cx: number;
  cy: number;
  r: number;
}

interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
}

interface ReferenceSignals {
  tags: Set<string>;
  rooms: Set<string>;
  /** Slugified note titles from ^ tokens — match against normalizeNoteSlug(note.title). */
  noteRefs: Set<string>;
}

interface OwnerSignals {
  tags: Set<string>;
  room: string | null;
}

/** An edge ready for SVG rendering — endpoints already resolved to cluster boundaries or note positions. */
interface RenderedEdge {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: number;
  relations: string[];
}

const TYPE_COLOR: Record<Note["type"], string> = {
  clue: "#f7c56e",
  code: "#8cc8ff",
  observation: "#9de6b0",
  theory: "#d8b3ff",
  story: "#f4a7a7",
  task: "#f0e68c",
};

const TYPE_ICON: Record<
  Note["type"],
  React.ComponentType<{ size?: number; className?: string }>
> = {
  clue: Lightbulb,
  code: Key,
  observation: Eye,
  theory: Sparkles,
  story: BookOpen,
  task: ListTodo,
};

export function GraphPage() {
  const { notes, todos, dataVersion } = useGraphStoreData();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  );

  const graphEntries = useMemo(() => toGraphEntries(notes, todos), [notes, todos]);
  const { nodes, edges, clusters } = useMemo(() => buildGraph(graphEntries), [graphEntries]);
  const nodeById = useMemo(() => indexNodes(nodes), [nodes]);
  const renderedEdges = useMemo(
    () => buildRenderedEdges(edges, nodeById, clusters),
    [edges, nodeById, clusters],
  );
  const selectedNodeId = useMemo(
    () =>
      selectedNoteId && nodes.some((node) => node.id === selectedNoteId) ? selectedNoteId : null,
    [nodes, selectedNoteId],
  );
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const incomingCount = selectedNode
    ? edges.filter((edge) => edge.to === selectedNode.id).length
    : 0;
  const outgoingCount = selectedNode
    ? edges.filter((edge) => edge.from === selectedNode.id).length
    : 0;

  function toSvgPoint(clientX: number, clientY: number, element: SVGSVGElement) {
    const rect = element.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 1000;
    const y = ((clientY - rect.top) / rect.height) * 680;
    return { x, y };
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function startDrag(event: MouseEvent<SVGSVGElement>) {
    const target = event.target as Element;
    const tag = target.tagName.toLowerCase();
    if (tag !== "svg" && tag !== "rect") return;

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsDragging(true);
  }

  function updateDrag(event: MouseEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * 1000;
    const dy = ((event.clientY - drag.startY) / rect.height) * 680;
    setPan({ x: drag.panX + dx, y: drag.panY + dy });
  }

  function stopDrag() {
    dragRef.current = null;
    setIsDragging(false);
  }

  function zoomWithWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const svg = event.currentTarget;
    const focus = toSvgPoint(event.clientX, event.clientY, svg);

    // Pinch gesture (ctrlKey=true) fires many small-delta events; regular scroll fires fewer large ones.
    // Normalise both to a comparable scale before applying the exponential factor.
    const isPinch = event.ctrlKey;
    const rawDelta = isPinch ? event.deltaY : (event.deltaMode === 0 ? event.deltaY / 120 : event.deltaY);
    const sensitivity = isPinch ? 0.04 : 0.18;
    const clamped = Math.max(-2, Math.min(2, rawDelta));
    const factor = Math.exp(-clamped * sensitivity);

    setZoom((currentZoom) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * factor));
      if (Math.abs(nextZoom - currentZoom) < 0.0005) return currentZoom;

      setPan((currentPan) => {
        const worldX = (focus.x - currentPan.x) / currentZoom;
        const worldY = (focus.y - currentPan.y) / currentZoom;
        return {
          x: focus.x - worldX * nextZoom,
          y: focus.y - worldY * nextZoom,
        };
      });

      return nextZoom;
    });
  }

  return (
    <PageLayout
      rightSidebar={
        <GraphRightPanel
          noteCount={nodes.length}
          edgeCount={edges.length}
          selectedNote={selectedNode?.note ?? null}
          incomingCount={incomingCount}
          outgoingCount={outgoingCount}
        />
      }
      middle={
        nodes.length === 0 ? (
          <EmptyState>
            No notes or todos yet. Add entries to build your connection graph.
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card/40 p-2">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <p>Drag on empty canvas to pan. Scroll to zoom.</p>
              <Button variant="outline" size="sm" onClick={resetView}>
                Reset view
              </Button>
            </div>
            <svg
              key={`graph-${dataVersion}`}
              viewBox={GRAPH_VIEWBOX}
              className={`h-[68vh] min-h-[420px] w-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              onMouseDown={startDrag}
              onMouseMove={updateDrag}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              onWheel={zoomWithWheel}
            >
              <rect x="0" y="0" width="1000" height="680" fill="transparent" />
              <defs>
                {(
                  [
                    { id: "room", fill: "rgba(224, 150, 40, 0.85)" },
                    { id: "tag",  fill: "rgba(70, 150, 210, 0.85)" },
                    { id: "both", fill: "rgba(140, 100, 210, 0.85)" },
                    { id: "note", fill: "rgba(50, 190, 100, 0.85)" },
                  ] as const
                ).map(({ id, fill }) => (
                  <marker
                    key={id}
                    id={`graph-arrow-${id}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={fill} />
                  </marker>
                ))}
              </defs>

              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                {clusters.map((cluster) => renderCluster(cluster))}
                {renderedEdges.map(({ key, x1, y1, x2, y2, weight, relations }) => {
                  const { stroke, marker } = edgeAppearance(relations);
                  return (
                    <line
                      key={key}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={stroke}
                      strokeWidth={Math.min(1 + weight * 0.4, 2.5)}
                      markerEnd={marker}
                    />
                  );
                })}

                {nodes.map((node) =>
                  renderNode(node, {
                    selected: node.id === selectedNoteId,
                    onSelect: () => setSelectedNoteId(node.id),
                    zoom,
                  }),
                )}
              </g>
            </svg>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
              <span className="font-medium uppercase tracking-wide">Links:</span>
              {[
                { color: "rgba(224,150,40,0.85)", label: "room" },
                { color: "rgba(70,150,210,0.85)",  label: "tag" },
                { color: "rgba(140,100,210,0.85)", label: "room + tag" },
                { color: "rgba(50,190,100,0.85)",  label: "note" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 uppercase tracking-wide">
                  <span style={{ background: color }} className="inline-block h-0.5 w-6 rounded-full" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )
      }
    >
      {/* middle content is provided via the `middle` prop */}
    </PageLayout>
  );
}

function renderNode(
  node: GraphNode,
  {
    selected,
    onSelect,
    zoom,
  }: {
    selected: boolean;
    onSelect: () => void;
    zoom: number;
  },
) {
  const Icon = TYPE_ICON[node.note.type];
  const stroke = selected ? "var(--color-ring)" : "var(--color-foreground)";
  const strokeWidth = selected ? 2.2 : 1.1;
  const labelScale = labelScaleForZoom(zoom);

  return (
    <g
      key={node.id}
      role="button"
      tabIndex={0}
      className="cursor-pointer"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_RADIUS}
        fill={TYPE_COLOR[node.note.type]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      >
        <title>{node.note.title}</title>
      </circle>

      <g transform={`translate(${node.x - NODE_ICON_SIZE / 2} ${node.y - NODE_ICON_SIZE / 2})`}>
        <Icon size={NODE_ICON_SIZE} className="text-black/80" />
      </g>

      <g transform={`translate(${node.x + 18} ${node.y + 5}) scale(${labelScale})`}>
        <text fill="var(--color-foreground)" fontSize="14" fontWeight="500" opacity="0.92">
          {trim(node.note.title, 22)}
        </text>
      </g>
    </g>
  );
}

function buildGraph(notes: Note[]): GraphModel {
  if (notes.length === 0) return { nodes: [], edges: [], clusters: [] };

  const refs = buildReferenceSignals(notes);
  const owners = buildOwnerSignals(notes);
  const { nodes, clusters } = buildClusteredLayout(notes);

  return { nodes, clusters, edges: buildEdges(notes, refs, owners) };
}

function toGraphEntries(notes: Note[], todos: Todo[]): Note[] {
  const todoEntries: Note[] = todos.map((todo) => ({
    id: `todo:${todo.id}`,
    type: "task",
    title: todo.title,
    body: todo.notes ?? "",
    room: todo.room,
    tags: todo.tags,
    date: undefined,
    status: todo.status === "done" ? "solved" : "open",
    scope: todo.scope === "someday" ? "cross-run" : todo.scope,
    imageIds: [],
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  }));

  return [...notes, ...todoEntries];
}

/** Groups notes by room and places them in mini-clusters spread around the canvas. */
function buildClusteredLayout(notes: Note[]): { nodes: GraphNode[]; clusters: GraphCluster[] } {
  const roomGroups = new Map<string | null, Note[]>();
  for (const note of notes) {
    const room = note.room?.trim() || null;
    const group = roomGroups.get(room) ?? [];
    group.push(note);
    roomGroups.set(room, group);
  }

  // Named rooms first (largest first), ungrouped notes last
  const sorted = [...roomGroups.entries()].sort(([aR, aG], [bR, bG]) => {
    if (aR === null && bR !== null) return 1;
    if (aR !== null && bR === null) return -1;
    return bG.length - aG.length;
  });

  const numClusters = sorted.length;
  const nodes: GraphNode[] = [];
  const clusters: GraphCluster[] = [];

  sorted.forEach(([room, roomNotes], ci) => {
    const angle = numClusters === 1 ? 0 : (2 * Math.PI * ci) / numClusters - Math.PI / 2;
    const orbitR = numClusters === 1 ? 0 : CLUSTER_ORBIT_RADIUS;
    const cx = LAYOUT_CENTER_X + Math.cos(angle) * orbitR;
    const cy = LAYOUT_CENTER_Y + Math.sin(angle) * orbitR;

    const n = roomNotes.length;
    const miniR =
      n === 1 ? 0 : Math.min(CLUSTER_MAX_NODE_RADIUS, Math.max(CLUSTER_MIN_NODE_RADIUS, n * CLUSTER_NODE_SCALE));

    roomNotes.forEach((note, ni) => {
      const noteAngle = n === 1 ? 0 : (2 * Math.PI * ni) / n - Math.PI / 2;
      const wobble = (hashId(note.id) % 14) - 7;
      nodes.push({
        id: note.id,
        note,
        x: cx + Math.cos(noteAngle) * (miniR + wobble),
        y: cy + Math.sin(noteAngle) * (miniR + wobble),
      });
    });

    if (room !== null) {
      clusters.push({
        room,
        label: room.replace(/[-_]+/g, " "),
        cx,
        cy,
        r: Math.max(miniR + NODE_RADIUS + 14, NODE_RADIUS + 20),
      });
    }
  });

  return { nodes, clusters };
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

  const idsByRoom = new Map<string, string[]>();
  const idsByTag = new Map<string, string[]>();
  const idBySlug = new Map<string, string>(); // normalizeNoteSlug(title) → noteId
  const slugById = new Map<string, string>(); // noteId → normalizeNoteSlug(title)

  notes.forEach((note) => {
    const slug = normalizeNoteSlug(note.title);
    idBySlug.set(slug, note.id);
    slugById.set(note.id, slug);
  });

  owners.forEach((owner, ownerId) => {
    if (owner.room) {
      const roomOwners = idsByRoom.get(owner.room);
      if (roomOwners) roomOwners.push(ownerId);
      else idsByRoom.set(owner.room, [ownerId]);
    }

    owner.tags.forEach((tag) => {
      const tagOwners = idsByTag.get(tag);
      if (tagOwners) tagOwners.push(ownerId);
      else idsByTag.set(tag, [ownerId]);
    });
  });

  for (const source of notes) {
    const sourceRefs = refs.get(source.id);
    if (!sourceRefs) continue;

    const candidateTargetIds = new Set<string>();

    // Direct ^ note references
    sourceRefs.noteRefs.forEach((slug) => {
      const targetId = idBySlug.get(slug);
      if (targetId && targetId !== source.id) candidateTargetIds.add(targetId);
    });

    sourceRefs.rooms.forEach((room) => {
      const roomOwners = idsByRoom.get(room);
      if (!roomOwners) return;
      roomOwners.forEach((targetId) => candidateTargetIds.add(targetId));
    });

    sourceRefs.tags.forEach((tag) => {
      const tagOwners = idsByTag.get(tag);
      if (!tagOwners) return;
      tagOwners.forEach((targetId) => candidateTargetIds.add(targetId));
    });

    candidateTargetIds.delete(source.id);

    candidateTargetIds.forEach((targetId) => {
      const targetOwner = owners.get(targetId);
      if (!targetOwner) return;

      const targetSlug = slugById.get(targetId) ?? "";
      const edge = buildDirectedEdge(source.id, targetId, targetSlug, sourceRefs, targetOwner);
      if (edge) edges.push(edge);
    });
  }

  return edges;
}

function buildDirectedEdge(
  sourceId: string,
  targetId: string,
  targetSlug: string,
  sourceRefs: ReferenceSignals,
  targetOwner: OwnerSignals,
): GraphEdge | null {
  // Direct note reference takes priority over room/tag connections
  if (sourceRefs.noteRefs.has(targetSlug)) {
    return { from: sourceId, to: targetId, weight: 3, relations: ["note"] };
  }

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
  const noteRefs = new Set<string>();

  const raw = `${note.title} ${note.body}`;

  const hashMatches = raw.match(/(?<!\w)#[\w-]+/g) ?? [];
  hashMatches.forEach((tok) => tags.add(normalizeTag(tok.slice(1))));

  const roomMatches = raw.match(/(?<!\w)@[\w-]+/g) ?? [];
  roomMatches.forEach((tok) => rooms.add(normalizeRoom(tok.slice(1))));

  const noteRefMatches = raw.match(/(?<!\w)\^[\w-]+/g) ?? [];
  noteRefMatches.forEach((tok) => noteRefs.add(tok.slice(1).toLowerCase()));

  return { tags, rooms, noteRefs };
}

function indexNodes(nodes: GraphNode[]) {
  const map = new Map<string, GraphNode>();
  nodes.forEach((node) => {
    map.set(node.id, node);
  });
  return map;
}

function edgeAppearance(relations: string[]): { stroke: string; marker: string } {
  if (relations.includes("note")) return { stroke: "rgba(50,190,100,0.70)", marker: "url(#graph-arrow-note)" };
  const hasRoom = relations.includes("room");
  const hasTag = relations.includes("tag");
  if (hasRoom && hasTag) return { stroke: "rgba(140,100,210,0.55)", marker: "url(#graph-arrow-both)" };
  if (hasRoom) return { stroke: "rgba(224,150,40,0.60)", marker: "url(#graph-arrow-room)" };
  return { stroke: "rgba(70,150,210,0.60)", marker: "url(#graph-arrow-tag)" };
}

/**
 * Converts note-level edges to renderable edges whose endpoints are anchored to cluster-circle
 * boundaries for room/tag connections, and to note positions for direct ^ references.
 * Room/tag edges are deduplicated to one arrow per unique cluster pair.
 */
function buildRenderedEdges(
  edges: GraphEdge[],
  nodeById: Map<string, GraphNode>,
  clusters: GraphCluster[],
): RenderedEdge[] {
  const clusterByRoom = new Map<string, GraphCluster>();
  for (const cluster of clusters) {
    if (cluster.room) clusterByRoom.set(cluster.room, cluster);
  }

  const clusterByNoteId = new Map<string, GraphCluster>();
  for (const [id, node] of nodeById) {
    const room = node.note.room?.trim();
    if (room) {
      const cluster = clusterByRoom.get(room);
      if (cluster) clusterByNoteId.set(id, cluster);
    }
  }

  const collapsed = new Map<string, Omit<RenderedEdge, "key">>();

  for (const edge of edges) {
    const fromNode = nodeById.get(edge.from);
    const toNode = nodeById.get(edge.to);
    if (!fromNode || !toNode) continue;

    // Direct note-ref (^) edges keep note-level endpoints; room/tag edges route via clusters.
    const isDirectRef = edge.relations.includes("note");
    const fromCluster = isDirectRef ? null : clusterByNoteId.get(edge.from);
    const toCluster = isDirectRef ? null : clusterByNoteId.get(edge.to);

    const fromKey = fromCluster ? `cluster:${fromCluster.room}` : edge.from;
    const toKey = toCluster ? `cluster:${toCluster.room}` : edge.to;

    if (fromKey === toKey) continue; // skip intra-cluster (same-room) edges

    const fromX = fromCluster ? fromCluster.cx : fromNode.x;
    const fromY = fromCluster ? fromCluster.cy : fromNode.y;
    const toX = toCluster ? toCluster.cx : toNode.x;
    const toY = toCluster ? toCluster.cy : toNode.y;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.hypot(dx, dy) || 1;

    const fromPad = fromCluster ? fromCluster.r : EDGE_NODE_PADDING;
    const toPad = toCluster ? toCluster.r : EDGE_NODE_PADDING;

    const x1 = fromX + (dx / dist) * fromPad;
    const y1 = fromY + (dy / dist) * fromPad;
    const x2 = toX - (dx / dist) * toPad;
    const y2 = toY - (dy / dist) * toPad;

    const key = `${fromKey}→${toKey}`;
    const existing = collapsed.get(key);
    if (existing) {
      collapsed.set(key, {
        ...existing,
        weight: Math.max(existing.weight, edge.weight),
        relations: [...new Set([...existing.relations, ...edge.relations])],
      });
    } else {
      collapsed.set(key, { x1, y1, x2, y2, weight: edge.weight, relations: edge.relations });
    }
  }

  return [...collapsed.entries()].map(([key, data]) => ({ key, ...data }));
}

function renderCluster(cluster: GraphCluster) {
  return (
    <g key={`cluster-${cluster.room}`}>
      <circle
        cx={cluster.cx}
        cy={cluster.cy}
        r={cluster.r}
        fill="var(--color-foreground)"
        fillOpacity="0.03"
        stroke="var(--color-foreground)"
        strokeOpacity="0.14"
        strokeWidth="1"
        strokeDasharray="5 3"
      />
      <text
        x={cluster.cx}
        y={cluster.cy + cluster.r + 13}
        fill="var(--color-foreground)"
        fillOpacity="0.45"
        fontSize="10"
        textAnchor="middle"
        fontStyle="italic"
      >
        {cluster.label}
      </text>
    </g>
  );
}

function labelScaleForZoom(zoom: number) {
  const inverse = 1 / zoom;
  return Math.max(MIN_LABEL_SCALE, Math.min(MAX_LABEL_SCALE, inverse));
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeRoom(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/** Converts a note title to a URL-safe slug used in ^ tokens (e.g. "The Parlor" → "the-parlor"). */
function normalizeNoteSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
