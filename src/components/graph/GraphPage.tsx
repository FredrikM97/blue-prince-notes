import { useMemo, useRef, useState, type MouseEvent, type ReactNode, type WheelEvent } from "react";
import { Button } from "@/components/common/Button";
import { Chip } from "@/components/common/Chip";
import { Dialog, DialogContent } from "@/components/common/Dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLayout } from "@/components/common/PageLayout";
import { MarkdownPreview } from "@/components/common/markdown/MarkdownPreview";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  Key,
  Lightbulb,
  ListTodo,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { useGraphStoreData } from "@/hooks/useGraphStoreData";
import type { Note, Todo } from "@/lib/types";

const ALL_NOTE_TYPES = ["clue", "code", "observation", "theory", "story", "task"] as const;

const GRAPH_VB_W = 1600;
const GRAPH_VB_H = 1100;
const GRAPH_VIEWBOX = `0 0 ${GRAPH_VB_W} ${GRAPH_VB_H}`;
const CLUSTER_NODE_SCALE = 9; // multiply by note count to get mini-cluster radius
const CLUSTER_MIN_NODE_RADIUS = 35;
const CLUSTER_MAX_NODE_RADIUS = 85;
const NODE_RADIUS = 13;
const EDGE_NODE_PADDING = 16;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3.0;
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
  const [hiddenRooms, setHiddenRooms] = useState<Set<string>>(new Set());
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const graphEntries = useMemo(() => toGraphEntries(notes, todos), [notes, todos]);

  const allRooms = useMemo(() => {
    const rooms = new Set<string>();
    for (const n of graphEntries) rooms.add(n.room?.trim() || "");
    return [...rooms].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
  }, [graphEntries]);

  const visibleEntries = useMemo(
    () =>
      hiddenRooms.size === 0 && hiddenTypes.size === 0
        ? graphEntries
        : graphEntries.filter(
            (n) =>
              (hiddenRooms.size === 0 || !hiddenRooms.has(n.room?.trim() || "")) &&
              (hiddenTypes.size === 0 || !hiddenTypes.has(n.type)),
          ),
    [graphEntries, hiddenRooms, hiddenTypes],
  );

  const { nodes, edges, clusters } = useMemo(() => buildGraph(visibleEntries), [visibleEntries]);

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

  const canvasProps = {
    nodes,
    clusters,
    renderedEdges,
    selectedNoteId,
    dataVersion,
    onSelectNote: setSelectedNoteId,
  };

  return (
    <>
      <PageLayout
        leftSidebar={
          <div className="page-layout-panel space-y-3">
            {/* Stats */}
            <p className="text-xs text-muted-foreground">
              {nodes.length} entries · {edges.length} links
            </p>

            {/* Types — compact 2-column grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>Types</span>
                {hiddenTypes.size > 0 && (
                  <button
                    className="normal-case text-[10px] text-amber-500 hover:underline"
                    onClick={() => setHiddenTypes(new Set())}
                  >
                    All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {ALL_NOTE_TYPES.map((type) => {
                  const active = !hiddenTypes.has(type);
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        setHiddenTypes((prev) => {
                          const next = new Set(prev);
                          if (next.has(type)) next.delete(type);
                          else next.add(type);
                          return next;
                        })
                      }
                      className={`flex w-full cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs transition-opacity hover:bg-muted/40 ${
                        active ? "opacity-100" : "opacity-35"
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: TYPE_COLOR[type] }}
                      />
                      <span className="capitalize">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rooms — collapsible */}
            {allRooms.length > 1 && (
              <div className="space-y-1.5">
                <button
                  className="flex w-full cursor-pointer items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  onClick={() => setRoomsOpen((v) => !v)}
                >
                  <span>
                    Rooms
                    {!roomsOpen && hiddenRooms.size > 0 && (
                      <span className="ml-1 text-[10px] normal-case text-amber-500">
                        ({allRooms.length - hiddenRooms.size}/{allRooms.length})
                      </span>
                    )}
                  </span>
                  {roomsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {roomsOpen && (
                  <div className="space-y-0.5">
                    {hiddenRooms.size > 0 && (
                      <button
                        className="mb-1 text-[10px] text-amber-500 hover:underline"
                        onClick={() => setHiddenRooms(new Set())}
                      >
                        Show all
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {allRooms.map((room) => {
                        const active = !hiddenRooms.has(room);
                        return (
                          <button
                            key={room || "__ungrouped__"}
                            onClick={() =>
                              setHiddenRooms((prev) => {
                                const next = new Set(prev);
                                if (next.has(room)) next.delete(room);
                                else next.add(room);
                                return next;
                              })
                            }
                            className={`flex w-full cursor-pointer items-center rounded px-1 py-0.5 text-left text-xs transition-opacity hover:bg-muted/40 ${
                              active ? "opacity-100" : "opacity-35"
                            }`}
                          >
                            <span className="truncate capitalize">{room || "Ungrouped"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected note inspector */}
            {selectedNode && (
              <>
                <div className="border-t border-border" />
                <div className="space-y-2">
                  <h3 className="font-serif text-base leading-snug">{selectedNode.note.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    <Chip>{selectedNode.note.type}</Chip>
                    {selectedNode.note.room && <Chip>@{selectedNode.note.room}</Chip>}
                    {selectedNode.note.tags.map((tag) => (
                      <Chip key={tag}>#{tag}</Chip>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ↑ {outgoingCount} out · ↓ {incomingCount} in
                  </p>
                  {selectedNode.note.body.trim() && (
                    <div className="rounded-md border border-border/60 bg-card/50 p-2 text-sm">
                      <MarkdownPreview>{selectedNode.note.body}</MarkdownPreview>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        }
        middle={
          nodes.length === 0 ? (
            <EmptyState>
              No notes or todos yet. Add entries to build your connection graph.
            </EmptyState>
          ) : (
            <GraphCanvas
              {...canvasProps}
              svgClassName="h-[78vh] min-h-[460px]"
              actions={
                <Button variant="outline" size="sm" onClick={() => setFullscreenOpen(true)}>
                  <Maximize2 size={13} />
                  Expand
                </Button>
              }
            />
          )
        }
      />

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-none w-[calc(100vw-2rem)] max-w-none flex-col gap-0 p-3 pr-10">
          <GraphCanvas
            {...canvasProps}
            plain
            className="flex-1 min-h-0"
            svgClassName="flex-1 min-h-0"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function GraphCanvas({
  nodes,
  clusters,
  renderedEdges,
  selectedNoteId,
  dataVersion,
  onSelectNote,
  className,
  svgClassName,
  actions,
  plain,
}: {
  nodes: GraphNode[];
  clusters: GraphCluster[];
  renderedEdges: RenderedEdge[];
  selectedNoteId: string | null;
  dataVersion: number;
  onSelectNote: (id: string) => void;
  className?: string;
  svgClassName?: string;
  actions?: ReactNode;
  plain?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  );

  function toSvgPoint(clientX: number, clientY: number, element: SVGSVGElement) {
    const pt = element.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = element.getScreenCTM();
    if (!ctm) {
      const rect = element.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }
    return pt.matrixTransform(ctm.inverse());
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function startDrag(event: MouseEvent<SVGSVGElement>) {
    const tag = (event.target as Element).tagName.toLowerCase();
    if (tag !== "svg" && tag !== "rect") return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
  }

  function updateDrag(event: MouseEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * GRAPH_VB_W;
    const dy = ((event.clientY - drag.startY) / rect.height) * GRAPH_VB_H;
    setPan({ x: drag.panX + dx, y: drag.panY + dy });
  }

  function stopDrag() {
    dragRef.current = null;
    setIsDragging(false);
  }

  function zoomWithWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const focus = toSvgPoint(event.clientX, event.clientY, event.currentTarget);
    const isPinch = event.ctrlKey;
    const rawDelta = isPinch
      ? event.deltaY
      : event.deltaMode === 0
        ? event.deltaY / 120
        : event.deltaY;
    const clamped = Math.max(-2, Math.min(2, rawDelta));
    const factor = Math.exp(-clamped * (isPinch ? 0.04 : 0.18));
    setZoom((currentZoom) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * factor));
      if (Math.abs(nextZoom - currentZoom) < 0.0005) return currentZoom;
      setPan((currentPan) => ({
        x: focus.x - ((focus.x - currentPan.x) / currentZoom) * nextZoom,
        y: focus.y - ((focus.y - currentPan.y) / currentZoom) * nextZoom,
      }));
      return nextZoom;
    });
  }

  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-lg p-2${plain ? "" : " border border-border bg-card/40"}${className ? ` ${className}` : ""}`}
    >
      <div className="flex shrink-0 items-center justify-between text-sm text-muted-foreground">
        <p className="text-xs">Drag to pan · scroll to zoom.</p>
        <div className="flex items-center gap-1.5">
          {actions}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-r-none border-r-0 px-2"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z / 1.3).toFixed(4))))}
            >
              −
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-none px-2"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z * 1.3).toFixed(4))))}
            >
              +
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={resetView}>
            Reset view
          </Button>
        </div>
      </div>

      <svg
        key={`graph-${dataVersion}`}
        viewBox={GRAPH_VIEWBOX}
        className={`w-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}${svgClassName ? ` ${svgClassName}` : ""}`}
        onMouseDown={startDrag}
        onMouseMove={updateDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onWheel={zoomWithWheel}
      >
        <rect x="0" y="0" width={GRAPH_VB_W} height={GRAPH_VB_H} fill="transparent" />
        <defs>
          {(
            [
              { id: "room", fill: "rgba(224, 150, 40, 0.85)" },
              { id: "tag", fill: "rgba(70, 150, 210, 0.85)" },
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
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={Math.min(1 + weight * 0.4, 2.5)}
                markerEnd={marker}
              />
            );
          })}
          {nodes.map((node) =>
            renderNode(node, {
              selected: node.id === selectedNoteId,
              onSelect: () => onSelectNote(node.id),
              zoom,
            }),
          )}
        </g>
      </svg>

      <div className="flex shrink-0 flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
        <span className="font-medium uppercase tracking-wide">Links:</span>
        {[
          { color: "rgba(224,150,40,0.85)", label: "room" },
          { color: "rgba(70,150,210,0.85)", label: "tag" },
          { color: "rgba(140,100,210,0.85)", label: "room + tag" },
          { color: "rgba(50,190,100,0.85)", label: "note" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 uppercase tracking-wide">
            <span style={{ background: color }} className="inline-block h-0.5 w-6 rounded-full" />
            {label}
          </span>
        ))}
      </div>
    </div>
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
  const edges = buildEdges(notes, refs, owners);
  const roomWeights = buildRoomWeights(notes, edges);
  const { nodes, clusters } = buildClusteredLayout(notes, roomWeights);

  return { nodes, clusters, edges };
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

/**
 * Aggregates node-level edges into room-level connection weights.
 * Key format: "roomA§roomB" (alphabetically ordered, § chosen to avoid conflicts).
 */
function buildRoomWeights(notes: Note[], edges: GraphEdge[]): Map<string, number> {
  const nodeRoom = new Map<string, string>();
  notes.forEach((n) => nodeRoom.set(n.id, n.room?.trim() || ""));

  const weights = new Map<string, number>();
  for (const edge of edges) {
    const ra = nodeRoom.get(edge.from) ?? "";
    const rb = nodeRoom.get(edge.to) ?? "";
    if (ra === rb) continue;
    const key = ra <= rb ? `${ra}§${rb}` : `${rb}§${ra}`;
    weights.set(key, (weights.get(key) ?? 0) + edge.weight);
  }
  return weights;
}

/**
 * Groups notes by room, runs a Fruchterman-Reingold force simulation so that
 * rooms sharing connections attract each other, then places nodes within clusters.
 */
function buildClusteredLayout(
  notes: Note[],
  roomWeights: Map<string, number>,
): { nodes: GraphNode[]; clusters: GraphCluster[] } {
  const roomGroups = new Map<string, Note[]>();
  for (const note of notes) {
    const room = note.room?.trim() || "";
    const group = roomGroups.get(room) ?? [];
    group.push(note);
    roomGroups.set(room, group);
  }

  // Named rooms first (largest first), ungrouped last
  const sorted = [...roomGroups.entries()].sort(([aR, aG], [bR, bG]) => {
    if (aR === "" && bR !== "") return 1;
    if (aR !== "" && bR === "") return -1;
    return bG.length - aG.length;
  });

  const numClusters = sorted.length;
  const nodes: GraphNode[] = [];
  const clusters: GraphCluster[] = [];
  if (numClusters === 0) return { nodes, clusters };

  // Ideal cell size derived from the largest cluster's radius
  const maxMiniR = sorted.reduce((max, [, roomNotes]) => {
    const n = roomNotes.length;
    if (n <= 1) return max;
    return Math.max(
      max,
      Math.min(CLUSTER_MAX_NODE_RADIUS, Math.max(CLUSTER_MIN_NODE_RADIUS, n * CLUSTER_NODE_SCALE)),
    );
  }, CLUSTER_MIN_NODE_RADIUS);
  const k = (maxMiniR + NODE_RADIUS + 14) * 2 + 80; // spring length = one cluster diameter + gap

  // Seed positions in a grid (deterministic: use room name hash for jitter)
  const cols = Math.max(1, Math.ceil(Math.sqrt(numClusters * 1.4)));
  const positions = new Map<string, { x: number; y: number }>();
  sorted.forEach(([room], ci) => {
    const col = ci % cols;
    const row = Math.floor(ci / cols);
    const h = room ? hashId(room) : 0;
    positions.set(room, {
      x: col * k + ((h % 200) / 200 - 0.5) * k * 0.1,
      y: row * k + (((h >> 9) % 200) / 200 - 0.5) * k * 0.1,
    });
  });

  // Fruchterman-Reingold: repel all pairs, attract connected pairs
  const roomIds = sorted.map(([room]) => room);
  const ITERATIONS = 80;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    roomIds.forEach((id) => forces.set(id, { fx: 0, fy: 0 }));

    // Repulsion between every pair of clusters
    for (let i = 0; i < roomIds.length; i++) {
      for (let j = i + 1; j < roomIds.length; j++) {
        const pa = positions.get(roomIds[i])!;
        const pb = positions.get(roomIds[j])!;
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        const dist = Math.max(Math.hypot(dx, dy), 1);
        const repulse = (k * k) / dist;
        const fa = forces.get(roomIds[i])!;
        const fb = forces.get(roomIds[j])!;
        fa.fx += (dx / dist) * repulse;
        fa.fy += (dy / dist) * repulse;
        fb.fx -= (dx / dist) * repulse;
        fb.fy -= (dy / dist) * repulse;
      }
    }

    // Attraction along edges (connected room pairs only)
    roomWeights.forEach((weight, key) => {
      const sep = key.indexOf("§");
      const ra = key.slice(0, sep);
      const rb = key.slice(sep + 1);
      const pa = positions.get(ra);
      const pb = positions.get(rb);
      if (!pa || !pb) return;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      const attract = ((dist * dist) / k) * Math.log1p(weight);
      const fa = forces.get(ra);
      const fb = forces.get(rb);
      if (!fa || !fb) return;
      fa.fx += (dx / dist) * attract;
      fa.fy += (dy / dist) * attract;
      fb.fx -= (dx / dist) * attract;
      fb.fy -= (dy / dist) * attract;
    });

    // Gravity: weak pull toward origin so disconnected clusters don't drift away
    roomIds.forEach((id) => {
      const p = positions.get(id)!;
      const f = forces.get(id)!;
      f.fx -= p.x * 0.04;
      f.fy -= p.y * 0.04;
    });

    // Cooling: temperature falls from k to near 0
    const temp = k * Math.max(0.01, (1 - iter / ITERATIONS) ** 1.5);
    roomIds.forEach((id) => {
      const p = positions.get(id)!;
      const f = forces.get(id)!;
      const mag = Math.hypot(f.fx, f.fy) || 1;
      const step = Math.min(mag, temp);
      p.x += (f.fx / mag) * step;
      p.y += (f.fy / mag) * step;
    });
  }

  // Normalize cluster centers to fit within the fixed 1000×680 viewBox.
  // This keeps the initial zoom=1 view useful regardless of how far the
  // physics simulation spread things.
  if (roomIds.length > 1) {
    const xs = roomIds.map((id) => positions.get(id)!.x);
    const ys = roomIds.map((id) => positions.get(id)!.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || k;
    const spanY = maxY - minY || k;
    const pad = 120; // px of breathing room on each side
    const scaleX = (GRAPH_VB_W - pad * 2) / spanX;
    const scaleY = (GRAPH_VB_H - pad * 2) / spanY;
    const scale = Math.min(scaleX, scaleY);
    const originX = GRAPH_VB_W / 2 - ((minX + maxX) / 2) * scale;
    const originY = GRAPH_VB_H / 2 - ((minY + maxY) / 2) * scale;
    roomIds.forEach((id) => {
      const p = positions.get(id)!;
      p.x = originX + p.x * scale;
      p.y = originY + p.y * scale;
    });

    // Post-normalization: iteratively push overlapping clusters apart so no
    // two cluster circles touch, then re-center the whole layout.
    const clusterExclusionR = new Map<string, number>(
      sorted.map(([room, roomNotes]) => {
        const n = roomNotes.length;
        const miniR =
          n <= 1
            ? 0
            : Math.min(
                CLUSTER_MAX_NODE_RADIUS,
                Math.max(CLUSTER_MIN_NODE_RADIUS, n * CLUSTER_NODE_SCALE),
              );
        return [room, Math.max(miniR + NODE_RADIUS + 14, NODE_RADIUS + 20) + 18]; // +18 gap
      }),
    );
    for (let oi = 0; oi < 80; oi++) {
      let anyMoved = false;
      for (let i = 0; i < roomIds.length; i++) {
        for (let j = i + 1; j < roomIds.length; j++) {
          const pa = positions.get(roomIds[i])!;
          const pb = positions.get(roomIds[j])!;
          const minDist =
            (clusterExclusionR.get(roomIds[i]) ?? 0) + (clusterExclusionR.get(roomIds[j]) ?? 0);
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          if (dist < minDist) {
            const push = (minDist - dist) / 2 + 0.5;
            const ux = dx / dist;
            const uy = dy / dist;
            pa.x -= ux * push;
            pa.y -= uy * push;
            pb.x += ux * push;
            pb.y += uy * push;
            anyMoved = true;
          }
        }
      }
      if (!anyMoved) break;
    }
    // Re-center after overlap correction
    const cxs = roomIds.map((id) => positions.get(id)!.x);
    const cys = roomIds.map((id) => positions.get(id)!.y);
    const driftX = GRAPH_VB_W / 2 - (Math.min(...cxs) + Math.max(...cxs)) / 2;
    const driftY = GRAPH_VB_H / 2 - (Math.min(...cys) + Math.max(...cys)) / 2;
    roomIds.forEach((id) => {
      const p = positions.get(id)!;
      p.x += driftX;
      p.y += driftY;
    });
  }

  // Place nodes within each cluster using the final force-directed positions
  sorted.forEach(([room, roomNotes]) => {
    const pos = positions.get(room)!;
    const { x: cx, y: cy } = pos;

    const n = roomNotes.length;
    const miniR =
      n === 1
        ? 0
        : Math.min(
            CLUSTER_MAX_NODE_RADIUS,
            Math.max(CLUSTER_MIN_NODE_RADIUS, n * CLUSTER_NODE_SCALE),
          );

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

    if (room !== "") {
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
  if (relations.includes("note"))
    return { stroke: "rgba(50,190,100,0.70)", marker: "url(#graph-arrow-note)" };
  const hasRoom = relations.includes("room");
  const hasTag = relations.includes("tag");
  if (hasRoom && hasTag)
    return { stroke: "rgba(140,100,210,0.55)", marker: "url(#graph-arrow-both)" };
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
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
