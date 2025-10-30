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
  [key: string]: any;
}

interface CustomNode extends Node {
  data: NodeData;
}

interface NodeConfigSidebarProps {
  selectedNode: CustomNode | null;
  onSaveConfig: (nodeId: string, parameters: Record<string, any>) => void;
  onClose: () => void;
}

export default function NodeConfigSidebar({
  selectedNode,
  onSaveConfig,
  onClose
}: NodeConfigSidebarProps) {
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40
        }}
      />

      {/* Sidebar */}
      <div
        className="fixed right-0 top-0 bottom-0 w-96 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col"
        style={{
          backgroundColor: backgroundColor,
          borderLeft: `3px solid ${borderColor}`
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b flex-shrink-0"
          style={{
            borderColor: borderColor + '40',
            backgroundColor: dialogConfig?.header_background || backgroundColor
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: dialogConfig?.icon_color || borderColor }}
            >
              {dialogConfig?.icon ? (
                <div
                  dangerouslySetInnerHTML={{ __html: dialogConfig.icon }}
                  style={{ color: textColor }}
                />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: textColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: textColor }}
              >
                {dialogConfig?.title || `Configure ${nodeSchema.name}`}
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: textColor + '80' }}
              >
                {dialogConfig?.description || nodeSchema.description.trim()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="transition-colors p-2 rounded-lg hover:bg-opacity-20"
            style={{
              color: textColor + '80',
              backgroundColor: borderColor + '20'
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-6 min-h-0"
          style={{
            backgroundColor: backgroundColor
          }}
        >
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
            <div className="text-center py-8" style={{ color: textColor + '80' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: borderColor + '20' }}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: borderColor }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2" style={{ color: textColor }}>No UI Configuration Available</p>
              <p className="text-sm" style={{ color: textColor + '80' }}>This node needs to be updated to use the declarative UI system.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end space-x-3 p-6 border-t flex-shrink-0"
          style={{
            borderColor: borderColor + '40',
            backgroundColor: dialogConfig?.footer_background || backgroundColor
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 transition-colors rounded-lg"
            style={{
              color: textColor + '80',
              backgroundColor: secondaryButtonColor
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg transition-colors font-medium"
            style={{
              backgroundColor: primaryButtonColor,
              color: '#ffffff'
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </>
  );
}
