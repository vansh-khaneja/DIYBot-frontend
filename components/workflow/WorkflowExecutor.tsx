'use client';

import React from 'react';
import { Node, Edge } from '@xyflow/react';

interface WorkflowExecutorProps {
  nodes: Node[];
  edges: Edge[];
  onExecute: () => void;
  isExecuting: boolean;
}

export default function WorkflowExecutor({
  nodes,
  edges,
  onExecute,
  isExecuting
}: WorkflowExecutorProps) {
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
            executionParams[param.name] = 'Hi there!';
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

  const validateWorkflow = () => {
    if (nodes.length === 0) {
      alert('Please add nodes to the workflow before executing');
      return false;
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
      return false;
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
            return false;
          }
        }
      }
    }

    return true;
  };

  const executeWorkflow = async () => {
    if (!validateWorkflow()) return;

    try {
      const workflowData = convertWorkflowForExecution();
      
      try {
        const response = await fetch('http://localhost:8000/api/v1/nodes/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        const result = JSON.parse(responseText);
        
        // Ensure result has proper structure
        const formattedResult = {
          success: result.success !== false,
          data: result.data || {},
          error: result.error || null,
          ...result
        };
        
        return formattedResult;
        
      } catch (fetchError) {
        throw fetchError;
      }
    } catch (error) {
      // Return error result instead of throwing
      return {
        success: false,
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  return {
    executeWorkflow,
    validateWorkflow,
    convertWorkflowForExecution
  };
}
