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
const LAYOUT_RADIUS = 250;
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
  const { nodes, edges } = useMemo(() => buildGraph(graphEntries), [graphEntries]);
  const nodeById = useMemo(() => indexNodes(nodes), [nodes]);
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
    const factor = event.deltaY > 0 ? 0.92 : 1.08;

    setZoom((currentZoom) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * factor));
      if (nextZoom === currentZoom) return currentZoom;

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
                <marker
                  id="graph-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-foreground)" opacity="0.45" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                {edges.map((edge) => renderEdge(edge, nodeById, zoom))}

                {nodes.map((node) =>
                  renderNode(node, {
                    selected: node.id === selectedNoteId,
                    onSelect: () => setSelectedNoteId(node.id),
                    zoom,
                  }),
                )}
              </g>
            </svg>
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
  if (notes.length === 0) return { nodes: [], edges: [] };

  const refs = buildReferenceSignals(notes);
  const owners = buildOwnerSignals(notes);

  return {
    nodes: buildNodes(notes),
    edges: buildEdges(notes, refs, owners),
  };
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

  const idsByRoom = new Map<string, string[]>();
  const idsByTag = new Map<string, string[]>();

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

      const edge = buildDirectedEdge(source.id, targetId, sourceRefs, targetOwner);
      if (edge) edges.push(edge);
    });
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

  const hashMatches = raw.match(/#[\w-]+/g) ?? [];
  hashMatches.forEach((tok) => tags.add(normalizeTag(tok.slice(1))));

  const roomMatches = raw.match(/@[\w-]+/g) ?? [];
  roomMatches.forEach((tok) => rooms.add(normalizeRoom(tok.slice(1))));

  return { tags, rooms };
}

function indexNodes(nodes: GraphNode[]) {
  const map = new Map<string, GraphNode>();
  nodes.forEach((node) => {
    map.set(node.id, node);
  });
  return map;
}

function renderEdge(edge: GraphEdge, nodeById: Map<string, GraphNode>, zoom: number) {
  const from = nodeById.get(edge.from);
  const to = nodeById.get(edge.to);
  if (!from || !to) return null;

  const line = edgeGeometry(from, to, EDGE_NODE_PADDING);
  const labelScale = labelScaleForZoom(zoom);

  return (
    <g key={`${edge.from}-${edge.to}`}>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="var(--color-foreground)"
        strokeOpacity="0.22"
        strokeWidth={Math.min(1 + edge.weight * 0.4, 3)}
        markerEnd="url(#graph-arrow)"
      />
      <g transform={`translate(${line.mx} ${line.my - 4}) scale(${labelScale})`}>
        <text fill="var(--color-foreground)" opacity="0.72" fontSize="9" textAnchor="middle">
          {edge.relations.join("+")}
        </text>
      </g>
    </g>
  );
}

function labelScaleForZoom(zoom: number) {
  const inverse = 1 / zoom;
  return Math.max(MIN_LABEL_SCALE, Math.min(MAX_LABEL_SCALE, inverse));
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
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeRoom(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
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
