'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from '../CustomNode';
import CanvasToolbar from './CanvasToolbar';
import CanvasAddButton from './CanvasAddButton';
import NodeWithConfig from '../NodeWithConfig';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  executingNodes: Set<string>;
  executingEdges: Set<string>;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onSaveWorkflow: () => void;
  onSaveWorkflowToBackend: () => void;
  onLoadWorkflow: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExecute: () => void;
  onAddNode: () => void;
  isExecuting: boolean;
  onUpdateParameters?: (nodeId: string, parameters: any) => void;
}

export default function Canvas({
  nodes,
  edges,
  executingNodes,
  executingEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onSaveWorkflow,
  onSaveWorkflowToBackend,
  onLoadWorkflow,
  onExecute,
  onAddNode,
  isExecuting,
  onUpdateParameters
}: CanvasProps) {
  // Node Types for React Flow - memoized to prevent React Flow warning
  const nodeTypes = useMemo(() => ({
    custom: (props: any) => {
      // Use NodeWithConfig for all node types - includes configuration
      return <NodeWithConfig {...props} onDelete={props.data.onDelete} nodeId={props.id} isExecuting={props.data.isExecuting} />;
    },
  }), []);

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isExecuting: executingNodes.has(node.id),
            onUpdateParameters: onUpdateParameters
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
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        fitView={nodes.length > 3}
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.2 }}
        className="bg-[#1a1a1a]"
        proOptions={{ hideAttribution: true }}
      >
        {/* Primary dot pattern - smaller grid */}
        <Background 
          id="background-1"
          color="#303030" 
          gap={12} 
          size={1.2}
          variant={BackgroundVariant.Dots}
          style={{ 
            backgroundColor: '#1e1e1e',
          }}
        />
        
        {/* Secondary grid pattern - tighter spacing */}
        <Background 
          id="background-2"
          color="#2a2a2a" 
          gap={48} 
          size={0.8}
          variant={BackgroundVariant.Lines}
          style={{ 
            opacity: 0.5,
          }}
        />

        {/* Toolbar */}
        <CanvasToolbar
          onSaveWorkflow={onSaveWorkflow}
          onSaveWorkflowToBackend={onSaveWorkflowToBackend}
          onLoadWorkflow={onLoadWorkflow}
          onExecute={onExecute}
          isExecuting={isExecuting}
          hasNodes={nodes.length > 0}
        />

        {/* Add Button */}
        <CanvasAddButton onAddNode={onAddNode} />



      </ReactFlow>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
        
        /* Subtle vignette effect for depth */
        .flex-1::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%);
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}