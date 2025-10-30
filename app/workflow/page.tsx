'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Canvas from '../../components/canvas/Canvas';
import NodeSelectionSidebar from '../../components/NodeSelectionSidebar';
import { useWorkflowState } from '../../hooks/useWorkflowState';
import WorkflowManager from '../../components/workflow/WorkflowManager';
import WorkflowExecutor from '../../components/workflow/WorkflowExecutor';
import NodeConfigStorage from '../../utils/nodeConfigStorage';

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
    setNodes,
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
    onExecute: () => {}, // We'll handle execution manually
    isExecuting
  });

  const handleExecuteWorkflow = async () => {
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
      
      // Update node data with response information
      if (result.success && result.data?.response_inputs) {
        const nodeUpdates: any[] = [];
        
        Object.entries(result.data.response_inputs).forEach(([nodeId, nodeData]: [string, any]) => {
          if (nodeData.final_response) {
            // Create node update to add response data
            nodeUpdates.push({
              id: nodeId,
              type: 'update',
              data: {
                response: nodeData.final_response,
                response_content: nodeData.response_content || nodeData.final_response
              }
            });
          }
        });
        
        // Apply the node updates manually using setNodes
        if (nodeUpdates.length > 0) {
          setNodes(prevNodes => 
            prevNodes.map(node => {
              const update = nodeUpdates.find(update => update.id === node.id);
              if (update) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    ...update.data
                  }
                };
              }
              return node;
            })
          );
        }
      }
      
      
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
  };


  // Handler for updating node parameters (e.g., collection selection)
  const handleUpdateParameters = (nodeId: string, parameters: any) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        // Save to memory cache using nodeId directly
        NodeConfigStorage.saveNodeConfig(nodeId, parameters);

        return {
          ...node,
          data: {
            ...node.data,
            parameters: {
              ...(node.data as any).parameters,
              ...parameters
            }
          }
        };
      }
      return node;
    });

    // Update the nodes state
    setNodes(updatedNodes);
  };


  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4">Loading nodes...</div>
          <div className="text-gray-400 text-sm">If this takes too long, make sure the backend server is running</div>
        </div>
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
          onExecute={handleExecuteWorkflow}
          onAddNode={handleAddNode}
          isExecuting={isExecuting}
          onUpdateParameters={handleUpdateParameters}
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


      {/* Execution Results Notification */}
      {executionResults && (
        <div className="fixed top-4 right-4 bg-[#2a2a2a] border border-[#404040] text-white px-4 py-2 rounded-lg shadow-lg z-40">
          ✅ Execution completed! Check responses around nodes.
        </div>
      )}
    </div>
  );
}
