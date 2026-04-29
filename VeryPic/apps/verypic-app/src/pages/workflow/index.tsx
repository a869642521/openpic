import { useCallback } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { useTheme, Theme } from '@/components/theme-provider';
import { useWorkflowStore, type WorkflowNodeKind } from '@/store/workflow';
import WorkflowCanvas from './canvas/workflow-canvas';
import WorkflowDock from './dock/workflow-dock';
import WorkflowToolbar from './toolbar/workflow-toolbar';
import InspectorPanel from './inspector/inspector-panel';

function WorkflowInner() {
  const { addNode } = useWorkflowStore();
  const rfInstance = useReactFlow();

  const handleDockAddNode = useCallback(
    (kind: WorkflowNodeKind) => {
      const viewport = rfInstance.getViewport();
      const center = rfInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      addNode(kind, {
        x: center.x + (Math.random() - 0.5) * 120,
        y: center.y + (Math.random() - 0.5) * 80,
      });
    },
    [rfInstance, addNode],
  );

  const { theme } = useTheme();
  const isDark =
    theme === Theme.Dark ||
    (theme === Theme.System && document.documentElement.classList.contains('dark'));

  return (
    <div className='verypic-workflow flex h-full flex-col overflow-hidden bg-[#FAFAFA] text-foreground dark:bg-[#111112]'>
      <WorkflowToolbar />
      <div className='relative flex-1 overflow-hidden'>
        <WorkflowCanvas isDark={isDark} />
        <InspectorPanel />
        <WorkflowDock onAddNode={handleDockAddNode} />
      </div>
    </div>
  );
}

export default function Workflow() {
  return (
    <ReactFlowProvider>
      <WorkflowInner />
    </ReactFlowProvider>
  );
}
