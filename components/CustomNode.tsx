'use client';

import { Handle, Position } from '@xyflow/react';

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

interface NodeData {
  nodeSchema: NodeSchema;
  parameters: Record<string, any>;
}

interface CustomNodeProps {
  data: NodeData;
  selected?: boolean;
  onDelete?: (nodeId: string) => void;
  nodeId?: string;
  isExecuting?: boolean;
}

export default function CustomNode({ data, selected, onDelete, nodeId, isExecuting }: CustomNodeProps) {
  const { nodeSchema, parameters } = data;

  return (
    <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] relative ${
      selected ? 'border-blue-500 bg-gray-700' : 'border-gray-600 bg-gray-700'
    } ${isExecuting ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}>
      {/* Execution Indicator */}
      {isExecuting && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      )}
      {/* Delete Button */}
      {onDelete && nodeId && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(nodeId);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10"
          title="Delete node"
        >
          ×
        </button>
      )}
      {/* Input Handles */}
      {nodeSchema.inputs.map((input, index) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={`input-${input.name}`}
          style={{
            background: input.required ? '#3b82f6' : '#6b7280',
            border: input.required ? '2px solid #93c5fd' : '2px solid #9ca3af',
            width: '12px',
            height: '12px',
            left: '-8px',
            top: `${((index + 1) / (nodeSchema.inputs.length + 1)) * 100}%`,
          }}
          title={`${input.name}${input.required ? ' (Required)' : ' (Optional)'}: ${input.description}`}
        />
      ))}

      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-white">{nodeSchema.name}</div>
          <div className="text-gray-300 text-xs uppercase tracking-wide">Chatbot Node</div>

          {/* Inputs */}
          {nodeSchema.inputs.length > 0 && (
            <div className="text-xs mt-2 text-gray-300">
              <div className="font-medium">Inputs:</div>
              {nodeSchema.inputs.map((input) => (
                <div key={input.name} className="ml-2">• {input.name}</div>
              ))}
            </div>
          )}

          {/* Outputs */}
          {nodeSchema.outputs.length > 0 && (
            <div className="text-xs mt-1 text-gray-300">
              <div className="font-medium">Outputs:</div>
              {nodeSchema.outputs.map((output) => (
                <div key={output.name} className="ml-2">• {output.name}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Output Handles */}
      {nodeSchema.outputs.map((output, index) => (
        <Handle
          key={`output-${output.name}`}
          type="source"
          position={Position.Right}
          id={`output-${output.name}`}
          style={{
            background: '#10b981',
            border: '2px solid #6ee7b7',
            width: '12px',
            height: '12px',
            right: '-8px',
            top: `${((index + 1) / (nodeSchema.outputs.length + 1)) * 100}%`,
          }}
          title={`${output.name}: ${output.description}`}
        />
      ))}
    </div>
  );
}
