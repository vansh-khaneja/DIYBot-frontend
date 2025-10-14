'use client';

import { useState, useEffect, useCallback } from 'react';
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
  custom: CustomNode,
};



export default function WorkflowBuilder() {
  const [nodesData, setNodesData] = useState<NodesResponse['data'] | null>(null);
  const [showNodeSidebar, setShowNodeSidebar] = useState(false);
  const [showConfigSidebar, setShowConfigSidebar] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    fetchNodes();
  }, []);

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
        parameters: {}
      },
    };

    setNodes(prev => [...prev, newNode]);
    setShowNodeSidebar(false);
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowConfigSidebar(true);
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
            nodes={nodes}
            edges={edges}
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
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                DIYBot Workflow Builder
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
    </div>
  );
}