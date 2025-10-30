'use client';

import React from 'react';
import { Node, Edge } from '@xyflow/react';

interface WorkflowManagerProps {
  nodes: Node[];
  edges: Edge[];
  onSaveWorkflow: () => void;
  onSaveWorkflowToBackend: () => void;
  onLoadWorkflow: (workflowData: any) => void;
}

export default function WorkflowManager({
  nodes,
  edges,
  onSaveWorkflow,
  onSaveWorkflowToBackend,
  onLoadWorkflow
}: WorkflowManagerProps) {
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
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

  const handleUploadWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target?.result as string);
        onLoadWorkflow(workflowData);
        alert('Workflow loaded successfully!');
      } catch (error) {
        alert('Invalid JSON file! Please select a valid workflow file.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  return {
    handleSaveWorkflow,
    handleSaveWorkflowToBackend,
    handleUploadWorkflow
  };
}
