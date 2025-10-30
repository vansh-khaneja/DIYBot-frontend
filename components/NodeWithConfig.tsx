'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import CustomNode from './CustomNode';
import DeclarativeUIRenderer from './DeclarativeUIRenderer';
import NodeConfigStorage from '../utils/nodeConfigStorage';

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
  onDelete?: (nodeId: string) => void;
  onUpdateParameters?: (nodeId: string, parameters: any, updatedNodeData?: any) => void;
  response_content?: string;
}

interface NodeWithConfigProps {
  data: NodeData;
  selected?: boolean;
  onDelete?: (nodeId: string) => void;
  nodeId?: string;
  isExecuting?: boolean;
}

export default function NodeWithConfig({ data, selected, onDelete, nodeId, isExecuting }: NodeWithConfigProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [configParameters, setConfigParameters] = useState<Record<string, any>>({});
  const configRef = useRef<HTMLDivElement>(null);

  const { nodeSchema, parameters } = data;

  // Debug logging for props
  console.log(`🏗️ [NODE PROPS] ${nodeSchema.name}:`, {
    nodeId,
    parameters: Object.keys(parameters || {})
  });
  const { styling } = nodeSchema;
  const uiConfig = nodeSchema.ui_config;

  // Initialize node configs when component mounts
  useEffect(() => {
    if (parameters && Object.keys(parameters).length > 0 && nodeId) {
      // Save current parameters to cache using nodeId
      NodeConfigStorage.saveNodeConfig(nodeId, parameters);
      console.log(`🎯 [NODE INIT] ${nodeSchema.name} (${nodeId}):`, parameters);
    }
  }, [parameters, nodeId, nodeSchema.name]);

  // Load parameters when configuration opens - prefer cache over current parameters
  useEffect(() => {
    if (showConfig && nodeId) {
      console.log(`🔍 [CONFIG OPEN] ${nodeSchema.name} - Looking for ${nodeId}`);

      // Try to load from cache first
      const savedConfig = NodeConfigStorage.loadNodeConfig(nodeId);

      if (savedConfig && savedConfig.parameters) {
        // Use saved parameters from cache
        setConfigParameters(savedConfig.parameters);
        console.log(`✅ [CONFIG OPEN] ${nodeSchema.name} - Loaded cached parameters:`, savedConfig.parameters);
      } else {
        // Fall back to current parameters
        setConfigParameters(parameters || {});
        console.log(`⚠️ [CONFIG OPEN] ${nodeSchema.name} - No cached config, using current:`, parameters);
      }

      console.log(`🔄 [CONFIG OPEN] ${nodeSchema.name} - Configuration opened, parameters loaded`);
    }
  }, [showConfig, nodeId, nodeSchema.name]);

  // Handle click outside to close config
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setShowConfig(false);
        console.log(`🖱️ [CLICK OUTSIDE] ${nodeSchema.name} - Closing configuration`);
      }
    };

    if (showConfig) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfig, nodeSchema.name]);

  const handleParameterChange = (paramName: string, value: any) => {
    console.log(`🔧 [PARAM CHANGE] ${nodeSchema.name}.${paramName}:`, value);
    setConfigParameters(prev => {
      const newParams = {
        ...prev,
        [paramName]: value
      };
      console.log(`📝 [PARAM CHANGE] ${nodeSchema.name} - Updated parameters:`, newParams);
      return newParams;
    });
  };

  const handleSaveConfig = async () => {
    console.log(`💾 [CONFIG SAVE] ${nodeSchema.name} - Saving parameters:`, configParameters);

    if (nodeId) {
      // Save to cache using nodeId directly
      NodeConfigStorage.saveNodeConfig(nodeId, configParameters);

      // Also update the parent component with parameters
      if (data.onUpdateParameters) {
        data.onUpdateParameters(nodeId, configParameters);
        console.log(`📤 [SAVE DEBUG] Updated parent component with parameters`);
      }

      console.log(`✅ [CONFIG SAVE] ${nodeSchema.name} - Saved successfully with ID: ${nodeId}`);
    } else {
      console.log(`❌ [CONFIG SAVE] ${nodeSchema.name} - Missing nodeId`);
    }

    setShowConfig(false);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    // Show configuration on node click
    e.stopPropagation();
    console.log(`🖱️ [NODE CLICK] ${nodeSchema.name} - Opening configuration`);
    setShowConfig(true);
  };

  // Use backend-provided colors or fallback to defaults
  const backgroundColor = uiConfig?.dialog_config?.background_color || '#1a1a1a';
  const borderColor = uiConfig?.dialog_config?.border_color || '#8b5cf6';
  const textColor = uiConfig?.dialog_config?.text_color || '#ffffff';
  const primaryButtonColor = uiConfig?.dialog_config?.button_primary_color || borderColor;
  const secondaryButtonColor = uiConfig?.dialog_config?.button_secondary_color || '#374151';

  return (
    <div className="relative">
      {/* Main Node */}
      <div onClick={handleNodeClick}>
        <CustomNode
          data={data}
          selected={selected}
          onDelete={onDelete}
          nodeId={nodeId}
          isExecuting={isExecuting}
        />
      </div>

      {/* Subtle Configuration Panel - appears below node */}
      {showConfig && (
        <div className="relative">          
          {/* Arrow pointer pointing UP to the node - positioned outside */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{
              top: '12px',
              zIndex: 60
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: `12px solid ${borderColor}`,
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
              }}
            />
          </div>
          
          {/* Main config panel */}
          <div
            ref={configRef}
            className="absolute left-1/2 transform -translate-x-1/2 w-80 z-50"
            style={{
              top: '24px',
              backgroundColor: `${backgroundColor}f0`,
              color: textColor,
              borderRadius: '12px',
              border: `1px solid ${borderColor}40`,
              overflow: 'hidden',
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px ${borderColor}15`,
              backdropFilter: 'blur(8px)',
              animation: 'slideUp 0.15s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes slideUp {
                  from {
                    opacity: 0;
                    transform: translate(-50%, 8px);
                  }
                  to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                  }
                }
                
                .config-panel-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .config-panel-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .config-panel-scrollbar::-webkit-scrollbar-thumb {
                  background: ${borderColor}30;
                  border-radius: 10px;
                }
                .config-panel-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: ${borderColor}50;
                }
              `
            }} />

            {/* Subtle gradient overlay */}
            <div 
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${borderColor}30 0%, transparent 70%)`
              }}
            />
          
            {uiConfig ? (
              <>
                {/* Compact Header */}
                <div
                  className="relative flex items-center justify-between px-4 py-3 border-b"
                  style={{
                    borderColor: `${borderColor}20`,
                    background: `${backgroundColor}40`
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center space-x-2">
                    {uiConfig.dialog_config?.icon && (
                      <div 
                        className="w-7 h-7 flex items-center justify-center rounded-lg"
                        style={{ 
                          color: uiConfig.dialog_config.icon_color || borderColor,
                          backgroundColor: `${borderColor}10`,
                          border: `1px solid ${borderColor}20`
                        }}
                        dangerouslySetInnerHTML={{ __html: uiConfig.dialog_config.icon }}
                      />
                    )}
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: textColor }}>
                        {uiConfig.dialog_config?.title || `Configure ${nodeSchema.name}`}
                      </h3>
                      {uiConfig.dialog_config?.description && (
                        <p className="text-xs opacity-50 mt-0.5" style={{ color: textColor }}>
                          {uiConfig.dialog_config.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfig(false);
                    }}
                    className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Compact Content */}
                <div
                  className="relative px-4 py-3 max-h-72 overflow-y-auto config-panel-scrollbar"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <DeclarativeUIRenderer
                    uiConfig={uiConfig}
                    parameters={configParameters}
                    onParameterChange={handleParameterChange}
                    nodeTheme={{
                      primaryColor: borderColor,
                      backgroundColor: backgroundColor,
                      textColor: textColor
                    }}
                  />
                </div>

                {/* Compact Footer */}
                <div
                  className="relative flex justify-end space-x-2 px-4 py-2.5 border-t"
                  style={{
                    borderColor: `${borderColor}20`,
                    background: `${backgroundColor}60`
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfig(false);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors hover:bg-white/5"
                    style={{
                      color: '#9ca3af'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveConfig();
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center space-x-1.5"
                    style={{
                      backgroundColor: primaryButtonColor,
                      color: '#ffffff'
                    }}
                  >
                    <span>Save</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center">
                <div 
                  className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${borderColor}10`,
                    border: `1px solid ${borderColor}30`
                  }}
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No configuration available</p>
                <button
                  onClick={() => setShowConfig(false)}
                  className="mt-3 px-4 py-2 text-sm rounded-lg font-medium"
                  style={{
                    backgroundColor: secondaryButtonColor,
                    color: '#ffffff'
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}