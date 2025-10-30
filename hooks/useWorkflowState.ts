'use client';

import { useState, useEffect, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState, Connection, addEdge } from '@xyflow/react';

interface NodesResponse {
  success: boolean;
  data: {
    nodes: string[];
    schemas: Record<string, any>;
    total_count: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useWorkflowState() {
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

  const fetchNodes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/nodes/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: NodesResponse = await response.json();
      if (data.success) {
        setNodesData(data.data);
      } else {
        console.warn('API returned success=false:', data);
      }
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
      // Set a default empty state so the app doesn't break
      setNodesData({
        nodes: [],
        schemas: {},
        total_count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleAddNode = () => {
    setShowNodeSidebar(true);
  };

  const handleNodeSelect = (nodeType: string) => {
    if (!nodesData) return;

    const nodeSchema = nodesData.schemas[nodeType];
    
    // Initialize parameters with default values
    const initialParameters: Record<string, any> = {};
    if (nodeSchema.parameters) {
      nodeSchema.parameters.forEach(param => {
        if (param.default_value !== undefined) {
          initialParameters[param.name] = param.default_value;
        }
      });
    }
    
    const newNode: Node = {
      id: `${nodeType}_${Date.now()}`,
      type: 'custom',
      position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
      data: {
        nodeSchema,
        parameters: initialParameters,
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

  const handleSaveNodeConfig = (nodeId: string, parameters: Record<string, any>) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...(node.data as any), parameters } }
          : node
      )
    );
  };

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  return {
    // State
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
    
    // Actions
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
  };
}
