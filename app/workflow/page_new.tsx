'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Canvas from '../../components/canvas/Canvas';
import NodeSelectionSidebar from '../../components/NodeSelectionSidebar';
import NodeConfigBottomBar from '../../components/NodeConfigBottomBar';
import ExecutionResults from '../../components/ExecutionResults';
import { useWorkflowState } from '../../hooks/useWorkflowState';
import { WorkflowManager } from '../../components/workflow/WorkflowManager';
import { WorkflowExecutor } from '../../components/workflow/WorkflowExecutor';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function WorkflowBuilder() {
  const searchParams = useSearchParams();
  
  // Use the custom hook for workflow state management
  const {
    nodesData,
    showNodeSidebar,
    showConfigSidebar,
    selectedNode,
    isExecuting,
    executionResults,
    executingEdges,
    executingNodes,
    loading,
    nodes,
    edges,
    setShowNodeSidebar,
    setShowConfigSidebar,
    setSelectedNode,
    setIsExecuting,
    setExecutionResults,
    setExecutingEdges,
    setExecutingNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    handleNodeSelect,
    handleNodeClick,
    handleNodeDelete,
    handleSaveNodeConfig,
    fetchNodes
  } = useWorkflowState();

  // Load saved workflow if ID is present
  useEffect(() => {
    const id = searchParams?.get('id');
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/workflows/${id}`);
        const data = await res.json();
        if (data.success && data.data?.data) {
          const wf = data.data.data;
          if (wf.nodes && wf.edges) {
            // This would need to be handled in the hook
            console.log('Workflow loaded:', wf);
          }
        }
      } catch (e) {
        console.error('Failed to load workflow', e);
      }
    })();
  }, [searchParams]);

  // Initialize workflow management and execution
  const workflowManager = WorkflowManager({
    nodes,
    edges,
    onSaveWorkflow: () => {},
    onSaveWorkflowToBackend: () => {},
    onLoadWorkflow: () => {}
  });

  const workflowExecutor = WorkflowExecutor({
    nodes,
    edges,
    onExecute: async () => {
      setIsExecuting(true);
      setExecutionResults(null);
      
      // Start animation for all edges
      const allEdgeIds = edges.map(edge => edge.id);
      const allNodeIds = nodes.map(node => node.id);
      setExecutingEdges(new Set(allEdgeIds));
      setExecutingNodes(new Set(allNodeIds));

      try {
        const result = await workflowExecutor.executeWorkflow();
        setExecutionResults(result);
      } catch (error) {
        setExecutionResults({
          success: false,
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setIsExecuting(false);
        setExecutingEdges(new Set());
        setExecutingNodes(new Set());
      }
    },
    isExecuting
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-white">Loading nodes...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Component */}
        <Canvas
          nodes={nodes}
          edges={edges}
          executingNodes={executingNodes}
          executingEdges={executingEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onSaveWorkflow={workflowManager.handleSaveWorkflow}
          onSaveWorkflowToBackend={workflowManager.handleSaveWorkflowToBackend}
          onLoadWorkflow={workflowManager.handleUploadWorkflow}
          onExecute={workflowExecutor.executeWorkflow}
          isExecuting={isExecuting}
        />

        {/* Node Selection Sidebar */}
        {showNodeSidebar && nodesData && (
          <NodeSelectionSidebar
            nodes={nodesData}
            onNodeSelect={handleNodeSelect}
            onClose={() => setShowNodeSidebar(false)}
          />
        )}
      </div>

      {/* Node Configuration Bottom Bar */}
      {showConfigSidebar && (
        <NodeConfigBottomBar
          selectedNode={selectedNode as any}
          onSaveConfig={handleSaveNodeConfig}
          onClose={() => setShowConfigSidebar(false)}
        />
      )}

      {/* Execution Results Modal */}
      {executionResults && (
        <ExecutionResults
          results={executionResults}
          onClose={() => setExecutionResults(null)}
        />
      )}
    </div>
  );
}
