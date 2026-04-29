import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/store/workflow';
import { nodeTypes } from '../nodes/node-types';

interface WorkflowCanvasProps {
  isDark: boolean;
}

export default function WorkflowCanvas({ isDark }: WorkflowCanvasProps) {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    setSelectedNodeId, addNode,
    undo, redo,
  } = useWorkflowStore();

  const rfInstance = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  // 双击画布空白 → 在点击位置直接生成压缩节点
  const onPaneDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode('compress', flowPos);
    },
    [rfInstance, addNode],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => setSelectedNodeId(node.id),
    [setSelectedNodeId],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    },
    [undo, redo],
  );

  const defaultEdgeOptions = {
    type: 'bezier',
    style: {
      strokeWidth: 1.5,
      stroke: isDark ? 'rgba(161,161,170,0.4)' : 'rgba(113,113,122,0.3)',
    },
  };

  return (
    <div
      ref={containerRef}
      className='verypic-workflow-canvas h-full w-full outline-none'
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDoubleClick={onPaneDoubleClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={2}
        zoomOnDoubleClick={false}
        colorMode={isDark ? 'dark' : 'light'}
        proOptions={{ hideAttribution: true }}
        className='verypic-workflow-reactflow'
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)'}
        />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          style={{ bottom: 20, left: 20 }}
        />
      </ReactFlow>
    </div>
  );
}
