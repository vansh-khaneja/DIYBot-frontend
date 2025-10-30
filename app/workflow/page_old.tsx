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
import { NodeData } from '../../types/workflow';

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
        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                isExecuting: executingNodes.has(node.id)
              }
            }))}
            edges={edges.map(edge => ({
              ...edge,
              style: executingEdges.has(edge.id) ? {
                strokeDasharray: '5,5',
                animation: 'dash 1s linear infinite',
                stroke: '#10b981',
                strokeWidth: 2
              } : undefined
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            fitView={nodes.length > 3}
            fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.2 }}
            className="bg-[#1B1B1B]"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1B1B1B" gap={20} />

            {/* Connection mode indicator */}
            <Panel position="top-center">
              <div className="bg-gray-800 border border-gray-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-4 backdrop-blur-sm">
                <span className="text-gray-200">DIYBot Workflow Builder</span>
                <div className="h-6 w-px bg-gray-600"></div>
                <button
                  onClick={handleSaveWorkflowToBackend}
                  disabled={nodes.length === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    nodes.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                      : 'bg-red-500 hover:bg-red-600 text-white border border-red-400 hover:border-red-300 shadow-sm hover:shadow-md'
                  }`}
                  title="Save workflow to backend (SQLite)"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001.555.832L10 14.2l5.445 2.632A1 1 0 0017 16V4a1 1 0 00-1-1H4z" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={handleSaveWorkflow}
                  disabled={nodes.length === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    nodes.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                      : 'bg-gray-600 hover:bg-gray-500 text-white border border-gray-500 hover:border-gray-400 shadow-sm hover:shadow-md'
                  }`}
                  title="Download workflow as JSON file"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Download JSON
                </button>
                <button
                  onClick={() => document.getElementById('workflow-upload')?.click()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-gray-500 hover:border-gray-400 shadow-sm hover:shadow-md"
                  title="Load workflow from JSON file"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Load
                </button>
                <input
                  id="workflow-upload"
                  type="file"
                  accept=".json"
                  onChange={handleUploadWorkflow}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || nodes.length === 0}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isExecuting || nodes.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                      : 'bg-red-500 hover:bg-red-600 text-white border border-red-400 hover:border-red-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isExecuting ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" />
                      </svg>
                      <span>Executing...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Execute Workflow
                    </>
                  )}
                </button>
              </div>
            </Panel>

            {/* Floating Add Button */}
            <Panel position="top-right">
              <button
                onClick={handleAddNode}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                title="Add new node"
              >
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </Panel>
          </ReactFlow>
        </div>

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