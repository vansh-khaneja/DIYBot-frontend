'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import DeclarativeUIRenderer from './DeclarativeUIRenderer';

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
  styling: {
    icon?: string;
    background_color?: string;
    border_color?: string;
    text_color?: string;
    custom_css?: string;
    subtitle?: string;
    icon_position?: string;
    shape?: 'rectangle' | 'circle' | 'rounded' | 'custom';
    width?: number;
    height?: number;
    html_template?: string;
    css_classes?: string;
    inline_styles?: string;
  };
  ui_config?: {
    node_id: string;
    node_name: string;
    groups: Array<{
      name: string;
      label: string;
      description?: string;
      components: Array<any>;
      collapsible?: boolean;
      collapsed?: boolean;
      styling?: Record<string, any>;
    }>;
    global_styling?: Record<string, any>;
    layout?: string;
    columns?: number;
  };
}

interface NodeData {
  nodeSchema: NodeSchema;
  parameters: Record<string, any>;
  [key: string]: any; // Add index signature for compatibility
}

interface CustomNode extends Node {
  data: NodeData;
}

interface NodeConfigBottomBarProps {
  selectedNode: CustomNode | null;
  onSaveConfig: (nodeId: string, parameters: Record<string, any>) => void;
  onClose: () => void;
}

export default function NodeConfigBottomBar({
  selectedNode,
  onSaveConfig,
  onClose
}: NodeConfigBottomBarProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setParameters(selectedNode.data.parameters || {});
    }
  }, [selectedNode]);

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleSave = () => {
    if (selectedNode) {
      onSaveConfig(selectedNode.id, parameters);
      onClose();
    }
  };

  if (!selectedNode) return null;

  const nodeSchema = selectedNode.data.nodeSchema;

  return (
    <div className="bg-gray-800 border-t border-gray-600 p-4 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Configure {nodeSchema.name}
            </h2>
            <p className="text-gray-300 text-sm">
              {nodeSchema.description.trim()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Declarative UI Configuration */}
        {nodeSchema.ui_config ? (
          <DeclarativeUIRenderer
            uiConfig={nodeSchema.ui_config}
            parameters={parameters}
            onParameterChange={handleParameterChange}
          />
        ) : (
          <div className="text-center text-gray-400 py-8">
            <p>No UI configuration available for this node.</p>
            <p className="text-sm mt-2">This node needs to be updated to use the declarative UI system.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
