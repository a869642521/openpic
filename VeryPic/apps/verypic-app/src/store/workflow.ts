import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange, type Connection, addEdge } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

export type WorkflowNodeKind = 'input' | 'filter' | 'resize' | 'convert' | 'compress' | 'watermark' | 'output';

/** React Flow applies `.react-flow__node-{type}`; built-in names `input`/`output` add legacy default box. Prefix avoids collision. */
export function workflowReactFlowType(kind: WorkflowNodeKind): string {
  return `wf-${kind}`;
}

// ── Config interfaces ──────────────────────────────────────────────────────

export interface InputConfig {
  source: 'files' | 'folder' | 'watch';
  paths: string[];
}

export interface FilterConfig {
  formats: string[];
  minSizeKb: number;
  maxSizeKb: number;
  enabled: boolean;
}

export interface ResizeConfig {
  mode: 'scale' | 'custom' | 'fit';
  scale: number;
  width: number;
  height: number;
  fit: 'cover' | 'contain' | 'fill';
}

export interface ConvertConfig {
  format: 'jpg' | 'png' | 'webp' | 'avif' | 'keep';
}

export interface CompressConfig {
  type: 'lossless' | 'lossy';
  quality: number;
  targetSizeEnable: boolean;
  targetSizeKb: number;
}

export interface WatermarkConfig {
  type: 'text' | 'image';
  text: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface OutputConfig {
  mode: 'overwrite' | 'new-file' | 'folder';
  suffix: string;
  folder: string;
}

export type NodeConfig =
  | InputConfig
  | FilterConfig
  | ResizeConfig
  | ConvertConfig
  | CompressConfig
  | WatermarkConfig
  | OutputConfig;

export interface WorkflowNodeData {
  kind: WorkflowNodeKind;
  label: string;
  enabled: boolean;
  config: NodeConfig;
  [key: string]: unknown;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

function labelKeyOf(kind: WorkflowNodeKind): string {
  const map: Record<WorkflowNodeKind, string> = {
    input: 'workflow.node.input.title',
    filter: 'workflow.node.filter.title',
    resize: 'workflow.node.resize.title',
    convert: 'workflow.node.convert.title',
    compress: 'workflow.node.compress.title',
    watermark: 'workflow.node.watermark.title',
    output: 'workflow.node.output.title',
  };
  return map[kind];
}

function defaultConfigOf(kind: WorkflowNodeKind): NodeConfig {
  switch (kind) {
    case 'input':
      return { source: 'files', paths: [] } as InputConfig;
    case 'filter':
      return { formats: [], minSizeKb: 0, maxSizeKb: 0, enabled: false } as FilterConfig;
    case 'resize':
      return { mode: 'scale', scale: 80, width: 1920, height: 1080, fit: 'contain' } as ResizeConfig;
    case 'convert':
      return { format: 'keep' } as ConvertConfig;
    case 'compress':
      return { type: 'lossless', quality: 80, targetSizeEnable: false, targetSizeKb: 200 } as CompressConfig;
    case 'watermark':
      return { type: 'text', text: '', opacity: 50, position: 'bottom-right' } as WatermarkConfig;
    case 'output':
      return { mode: 'overwrite', suffix: '-compressed', folder: '' } as OutputConfig;
  }
}

let _counter = 0;
function newId(kind: WorkflowNodeKind) {
  return `${kind}-${++_counter}-${Date.now()}`;
}

const createInitialNodes = (): WorkflowNode[] => [
  {
    id: newId('input'),
    type: workflowReactFlowType('input'),
    position: { x: 80, y: 160 },
    data: { kind: 'input', label: labelKeyOf('input'), enabled: true, config: defaultConfigOf('input') },
  },
  {
    id: newId('compress'),
    type: workflowReactFlowType('compress'),
    position: { x: 420, y: 160 },
    data: { kind: 'compress', label: labelKeyOf('compress'), enabled: true, config: defaultConfigOf('compress') },
  },
  {
    id: newId('output'),
    type: workflowReactFlowType('output'),
    position: { x: 760, y: 160 },
    data: { kind: 'output', label: labelKeyOf('output'), enabled: true, config: defaultConfigOf('output') },
  },
];

const createInitialEdges = (nodes: WorkflowNode[]): WorkflowEdge[] => [
  {
    id: `e-${nodes[0].id}-${nodes[1].id}`,
    source: nodes[0].id,
    target: nodes[1].id,
    type: 'bezier',
  },
  {
    id: `e-${nodes[1].id}-${nodes[2].id}`,
    source: nodes[1].id,
    target: nodes[2].id,
    type: 'bezier',
  },
];

interface WorkflowSnapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  history: WorkflowSnapshot[];
  future: WorkflowSnapshot[];
  workflowName: string;

  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNodeId: (id: string | null) => void;
  addNode: (kind: WorkflowNodeKind, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void;
  toggleNodeEnabled: (id: string) => void;
  duplicateNode: (id: string) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  resetCanvas: () => void;
  setWorkflowName: (name: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => {
  const initialNodes = createInitialNodes();
  const initialEdges = createInitialEdges(initialNodes);

  return {
    nodes: initialNodes,
    edges: initialEdges,
    selectedNodeId: null,
    history: [],
    future: [],
    workflowName: '',

    onNodesChange: (changes) => {
      set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) }));
    },
    onEdgesChange: (changes) => {
      set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }));
    },
    onConnect: (connection) => {
      get().pushHistory();
      set((s) => ({ edges: addEdge({ ...connection, type: 'bezier' }, s.edges) }));
    },
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),

    addNode: (kind, position) => {
      get().pushHistory();
      const id = newId(kind);
      const node: WorkflowNode = {
        id,
        type: workflowReactFlowType(kind),
        position,
        data: { kind, label: labelKeyOf(kind), enabled: true, config: defaultConfigOf(kind) },
      };
      set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: id }));
    },

    removeNode: (id) => {
      get().pushHistory();
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }));
    },

    updateNodeConfig: (id, patch) => {
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, config: { ...(n.data.config as object), ...(patch as object) } as NodeConfig } }
            : n,
        ),
      }));
    },

    toggleNodeEnabled: (id) => {
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, enabled: !n.data.enabled } } : n,
        ),
      }));
    },

    duplicateNode: (id) => {
      get().pushHistory();
      const node = get().nodes.find((n) => n.id === id);
      if (!node) return;
      const newNode: WorkflowNode = {
        ...node,
        id: newId(node.data.kind),
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        selected: false,
      };
      set((s) => ({ nodes: [...s.nodes, newNode], selectedNodeId: newNode.id }));
    },

    pushHistory: () => {
      const { nodes, edges, history } = get();
      set({ history: [...history.slice(-30), { nodes, edges }], future: [] });
    },

    undo: () => {
      const { history, nodes, edges, future } = get();
      if (!history.length) return;
      const prev = history[history.length - 1];
      set({ nodes: prev.nodes, edges: prev.edges, history: history.slice(0, -1), future: [{ nodes, edges }, ...future] });
    },

    redo: () => {
      const { future, nodes, edges, history } = get();
      if (!future.length) return;
      const next = future[0];
      set({ nodes: next.nodes, edges: next.edges, future: future.slice(1), history: [...history, { nodes, edges }] });
    },

    resetCanvas: () => {
      const nodes = createInitialNodes();
      const edges = createInitialEdges(nodes);
      set({ nodes, edges, selectedNodeId: null, history: [], future: [] });
    },

    setWorkflowName: (name) => set({ workflowName: name }),
  };
});
