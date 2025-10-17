'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from '../../components/CustomNode';
import NodeSelectionSidebar from '../../components/NodeSelectionSidebar';
import NodeConfigBottomBar from '../../components/NodeConfigBottomBar';
import ExecutionResults from '../../components/ExecutionResults';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Node data structure for React Flow
interface NodeData {
  nodeSchema: NodeSchema;
  parameters: Record<string, any>;
}

interface NodeSchema {
  node_id: string;
  name: string;
  description: string;
  inputs: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default_value: any;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default_value: any;
    options: string[] | null;
  }>;
}

interface NodesResponse {
  success: boolean;
  data: {
    nodes: string[];
    schemas: Record<string, NodeSchema>;
    total_count: number;
  };
}


// Node Types for React Flow
const nodeTypes = {
  custom: (props: any) => <CustomNode {...props} onDelete={props.data.onDelete} nodeId={props.id} isExecuting={props.data.isExecuting} />,
};



export default function WorkflowBuilder() {
  const searchParams = useSearchParams();
  const [nodesData, setNodesData] = useState<NodesResponse['data'] | null>(null);
  const [showNodeSidebar, setShowNodeSidebar] = useState(false);
  const [showConfigSidebar, setShowConfigSidebar] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [executingEdges, setExecutingEdges] = useState<Set<string>>(new Set());
  const [executingNodes, setExecutingNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    fetchNodes();
  }, []);

  // If ?id= is present, fetch saved workflow and load into canvas
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
            setNodes(wf.nodes as any);
            setEdges(wf.edges as any);
          }
        }
      } catch (e) {
        console.error('Failed to load workflow', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchNodes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/nodes/');
      const data: NodesResponse = await response.json();
      if (data.success) {
        setNodesData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = () => {
    setShowNodeSidebar(true);
  };

  const handleNodeSelect = (nodeType: string) => {
    if (!nodesData) return;

    const nodeSchema = nodesData.schemas[nodeType];
    const newNode: Node = {
      id: `${nodeType}_${Date.now()}`,
      type: 'custom',
      position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
      data: {
        nodeSchema,
        parameters: {},
        onDelete: handleNodeDelete
      },
    };

    setNodes(prev => [...prev, newNode]);
    setShowNodeSidebar(false);
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowConfigSidebar(true);
  };

  const handleNodeDelete = (nodeId: string) => {
    // Remove the node
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    // Remove all edges connected to this node
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    // Close config sidebar if this node was selected
    if (selectedNode?.id === nodeId) {
      setShowConfigSidebar(false);
      setSelectedNode(null);
    }
  };

  const buildWorkflowPayload = () => {
    const workflowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      })),
      timestamp: new Date().toISOString(),
      name: `Workflow_${new Date().toISOString().split('T')[0]}_${Date.now()}`
    };
    return workflowData;
  };

  const handleSaveWorkflow = () => {
    const workflowData = buildWorkflowPayload();

    // Create and download JSON file
    const jsonString = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowData.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Workflow saved as JSON file!');
  };

  const handleSaveWorkflowToBackend = async () => {
    try {
      const payload = buildWorkflowPayload();
      const res = await fetch(`${API_BASE}/api/v1/workflows/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload.name, data: { nodes: payload.nodes, edges: payload.edges } })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed to save workflow: ${res.status} ${t}`);
      }
      alert('Workflow saved to backend (SQLite).');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save workflow');
    }
  };

  const handleLoadWorkflow = (workflowData: any) => {
    setNodes(workflowData.nodes);
    setEdges(workflowData.edges);
    alert('Workflow loaded successfully!');
  };

  const handleUploadWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target?.result as string);
        handleLoadWorkflow(workflowData);
      } catch (error) {
        alert('Invalid JSON file! Please select a valid workflow file.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleSaveNodeConfig = (nodeId: string, parameters: Record<string, any>) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...(node.data as unknown as NodeData), parameters } }
          : node
      )
    );
  };

  const convertWorkflowForExecution = () => {
    const executionNodes: Record<string, any> = {};
    const executionEdges: any[] = [];

    // Map display names to registry IDs (backend uses __name__.lower())
    const nodeTypeMapping: Record<string, string> = {
      'QueryNode': 'querynode',
      'ResponseNode': 'responsenode',
      'LanguageModelNode': 'languagemodelnode'
    };

    nodes.forEach(node => {
      const nodeSchema = (node.data as any).nodeSchema;
      const nodeParams = (node.data as any).parameters || {};
      const registryType = nodeTypeMapping[nodeSchema.name] || nodeSchema.name.toLowerCase();

      // Ensure required parameters have values, set defaults if needed
      const executionParams = { ...nodeParams };

      for (const param of nodeSchema.parameters || []) {
        if (param.required && (!executionParams[param.name] || executionParams[param.name] === '')) {
          // Set default values for common required parameters
          if (param.name === 'query' && nodeSchema.name === 'QueryNode') {
            executionParams[param.name] = 'Hello, how can I help you?';
          } else if (param.name === 'service' && nodeSchema.name === 'LanguageModelNode') {
            executionParams[param.name] = 'openai';
          } else if (param.default_value !== undefined) {
            executionParams[param.name] = param.default_value;
          }
        }
      }

      executionNodes[node.id] = {
        type: registryType,
        parameters: executionParams
      };
    });

    edges.forEach(edge => {
      const sourceOutput = edge.sourceHandle?.replace('output-', '') || 'result';
      const targetInput = edge.targetHandle?.replace('input-', '') || 'query';

      executionEdges.push({
        from: {
          node: edge.source,
          output: sourceOutput
        },
        to: {
          node: edge.target,
          input: targetInput
        }
      });
    });

    return {
      nodes: executionNodes,
      edges: executionEdges
    };
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      alert('Please add nodes to the workflow before executing');
      return;
    }

    // Validate workflow has required nodes
    const nodeTypes = nodes.map(node => {
      const nodeSchema = (node.data as any).nodeSchema;
      const nodeTypeMapping: Record<string, string> = {
        'QueryNode': 'querynode',
        'ResponseNode': 'responsenode',
        'LanguageModelNode': 'languagemodelnode'
      };
      return nodeTypeMapping[nodeSchema.name] || nodeSchema.name.toLowerCase();
    });

    const hasQueryNode = nodeTypes.some(type => type.toLowerCase() === 'querynode');
    const hasResponseNode = nodeTypes.some(type => type.toLowerCase() === 'responsenode');

    if (!hasQueryNode || !hasResponseNode) {
      alert('Workflow must include at least one QueryNode and one ResponseNode');
      return;
    }

    // Check for critical missing parameters that don't have defaults
    for (const node of nodes) {
      const nodeSchema = (node.data as any).nodeSchema;
      const nodeParams = (node.data as any).parameters || {};

      for (const param of nodeSchema.parameters || []) {
        if (param.required && (!nodeParams[param.name] || nodeParams[param.name] === '')) {
          // Only alert for parameters that don't have defaults set in the conversion function
          if (param.name === 'query' && nodeSchema.name === 'QueryNode') {
            // This will get a default value, so no alert needed
            continue;
          } else if (param.name === 'service' && nodeSchema.name === 'LanguageModelNode') {
            // This will get a default value, so no alert needed
            continue;
          } else if (param.default_value !== undefined) {
            // This will get a default value, so no alert needed
            continue;
          } else {
            // Alert for truly missing required parameters without defaults
            alert(`Node "${nodeSchema.name}" is missing required parameter: ${param.name}`);
            return;
          }
        }
      }
    }

    setIsExecuting(true);
    setExecutionResults(null);
    
    // Start animation for all edges
    const allEdgeIds = edges.map(edge => edge.id);
    const allNodeIds = nodes.map(node => node.id);
    setExecutingEdges(new Set(allEdgeIds));
    setExecutingNodes(new Set(allNodeIds));

    try {
      const workflowData = convertWorkflowForExecution();
      console.log('Workflow nodes:', nodes.map(n => ({
        id: n.id,
        type: (n.data as any).nodeSchema.name,
        params: (n.data as any).parameters || {}
      })));
      console.log('Workflow edges:', edges.map(e => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle
      })));
      console.log('Converted workflow data:', JSON.stringify(workflowData, null, 2));
      console.log('Node types being sent:', Object.values(workflowData.nodes).map((n: any) => n.type));

      const response = await fetch('http://localhost:8000/api/v1/nodes/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      // Ensure result has proper structure
      const formattedResult = {
        success: result.success !== false,
        data: result.data || {},
        error: result.error || null,
        ...result
      };
      setExecutionResults(formattedResult);
    } catch (error) {
      console.error('Execution failed:', error);
      // Show error in results modal instead of alert
      setExecutionResults({
        success: false,
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsExecuting(false);
      setExecutingEdges(new Set()); // Stop animation
      setExecutingNodes(new Set()); // Stop node animation
    }
  };

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-800 items-center justify-center">
        <div className="text-white">Loading nodes...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-800">
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
            className="bg-gray-800"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#aaa" gap={20} />

            {/* Connection mode indicator */}
            <Panel position="top-center">
              <div className="bg-gray-700 border border-gray-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-4">
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