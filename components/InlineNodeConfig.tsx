'use client';

import React, { useState, useEffect } from 'react';
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
    dialog_config?: {
      title: string;
      description: string;
      width: string;
      height: string;
      background_color: string;
      border_color: string;
      text_color: string;
      icon?: string;
      icon_color?: string;
      header_background?: string;
      footer_background?: string;
      button_primary_color?: string;
      button_secondary_color?: string;
    };
  };
}

interface NodeData {
  nodeSchema: NodeSchema;
  parameters: Record<string, any>;
}

interface InlineNodeConfigProps {
  selectedNode: Node<NodeData> | null;
  onSaveConfig: (nodeId: string, parameters: Record<string, any>) => void;
  onClose: () => void;
}

export default function InlineNodeConfig({
  selectedNode,
  onSaveConfig,
  onClose
}: InlineNodeConfigProps) {
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
  const uiConfig = nodeSchema.ui_config;
  const dialogConfig = uiConfig?.dialog_config;

  // Use backend-provided colors or fallback to defaults
  const backgroundColor = dialogConfig?.background_color || '#1f1f1f';
  const borderColor = dialogConfig?.border_color || '#60a5fa';
  const textColor = dialogConfig?.text_color || '#ffffff';
  const primaryButtonColor = dialogConfig?.button_primary_color || borderColor;
  const secondaryButtonColor = dialogConfig?.button_secondary_color || '#374151';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl"
        style={{
          backgroundColor,
          border: `2px solid ${borderColor}`,
          color: textColor
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ 
            borderColor: borderColor + '40',
            backgroundColor: dialogConfig?.header_background || backgroundColor
          }}
        >
          <div className="flex items-center space-x-3">
            {dialogConfig?.icon && (
              <div 
                className="w-8 h-8 flex items-center justify-center"
                style={{ color: dialogConfig.icon_color || borderColor }}
                dangerouslySetInnerHTML={{ __html: dialogConfig.icon }}
              />
            )}
            <div>
              <h2 className="text-xl font-semibold" style={{ color: textColor }}>
                {dialogConfig?.title || `Configure ${nodeSchema.name}`}
              </h2>
              <p className="text-sm opacity-80" style={{ color: textColor }}>
                {dialogConfig?.description || nodeSchema.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Declarative UI Configuration */}
          {uiConfig ? (
            <DeclarativeUIRenderer
              uiConfig={uiConfig}
              parameters={parameters}
              onParameterChange={handleParameterChange}
              nodeTheme={{
                primaryColor: borderColor,
                backgroundColor: backgroundColor,
                textColor: textColor
              }}
            />
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No UI configuration available for this node.</p>
              <p className="text-sm mt-2">This node needs to be updated to use the declarative UI system.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex justify-end space-x-3 p-6 border-t"
          style={{ 
            borderColor: borderColor + '40',
            backgroundColor: dialogConfig?.footer_background || backgroundColor
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: secondaryButtonColor,
              color: '#ffffff'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: primaryButtonColor,
              color: '#ffffff'
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
