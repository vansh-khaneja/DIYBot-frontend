'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

// Global function declaration for parameter updates and query editing
declare global {
  interface Window {
    updateNodeParameter?: (nodeId: string, parameters: any) => void;
    toggleQueryEdit?: (container: HTMLElement) => void;
    saveQuery?: (nodeId: string) => void;
    cancelQuery?: (nodeId: string) => void;
  }
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
}

interface NodeData {
  nodeSchema: NodeSchema;
  parameters: Record<string, any>;
  onDelete?: (nodeId: string) => void;
  onUpdateParameters?: (nodeId: string, parameters: any) => void;
  response_content?: string;
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
  const { styling } = nodeSchema;

  // Handle click events - no special handling needed for QueryNode anymore
  const handleNodeClick = (e: React.MouseEvent) => {
    // No special handling needed - let the normal node selection work
  };

  // Set up global functions for query node editing
  React.useEffect(() => {
    if (data.onUpdateParameters) {
      window.updateNodeParameter = (id: string, newParameters: any) => {
        data.onUpdateParameters?.(id, newParameters);
      };
    }

    // No inline editing functions needed anymore
    if (false) {
      window.toggleQueryEdit = (container: HTMLElement) => {
        const editElement = container.querySelector('.query-edit') as HTMLElement;
        if (!editElement) return;
        
        const nodeId = editElement.id.replace('query-edit-', '');
        const display = document.getElementById('query-display-' + nodeId);
        const edit = document.getElementById('query-edit-' + nodeId) as HTMLTextAreaElement;
        const actions = container.querySelector('.query-actions') as HTMLElement;
        
        if (container.classList.contains('editing')) {
          return; // Already editing
        }
        
        container.classList.add('editing');
        if (display) display.style.display = 'none';
        if (edit) edit.style.display = 'block';
        if (actions) actions.style.display = 'flex';
        if (edit) {
          edit.focus();
          edit.select();
        }
      };

      window.saveQuery = (nodeId: string) => {
        const container = document.querySelector(`[id*="${nodeId}"]`)?.closest('.query-node-container') as HTMLElement;
        if (!container) return;
        
        const display = document.getElementById('query-display-' + nodeId);
        const edit = document.getElementById('query-edit-' + nodeId) as HTMLTextAreaElement;
        const actions = container.querySelector('.query-actions') as HTMLElement;
        
        // Update display with new value
        if (display && edit) {
          display.textContent = edit.value;
        }
        
        // Hide edit mode
        container.classList.remove('editing');
        if (display) display.style.display = 'block';
        if (edit) edit.style.display = 'none';
        if (actions) actions.style.display = 'none';
        
        // Trigger parameter update
        if (window.updateNodeParameter) {
          window.updateNodeParameter(nodeId, { query: edit?.value || '' });
        }
      };

      window.cancelQuery = (nodeId: string) => {
        const container = document.querySelector(`[id*="${nodeId}"]`)?.closest('.query-node-container') as HTMLElement;
        if (!container) return;
        
        const display = document.getElementById('query-display-' + nodeId);
        const edit = document.getElementById('query-edit-' + nodeId) as HTMLTextAreaElement;
        const actions = container.querySelector('.query-actions') as HTMLElement;
        
        // Reset edit value to display value
        if (display && edit) {
          edit.value = display.textContent || '';
        }
        
        // Hide edit mode
        container.classList.remove('editing');
        if (display) display.style.display = 'block';
        if (edit) edit.style.display = 'none';
        if (actions) actions.style.display = 'none';
      };

      // Handle keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const editingContainer = document.querySelector('.query-node-container.editing');
          if (editingContainer) {
            const editElement = editingContainer.querySelector('.query-edit') as HTMLElement;
            if (editElement) {
              const nodeId = editElement.id.replace('query-edit-', '');
              window.cancelQuery?.(nodeId);
            }
          }
        }
        if (e.key === 'Enter' && e.ctrlKey) {
          const editingContainer = document.querySelector('.query-node-container.editing');
          if (editingContainer) {
            const editElement = editingContainer.querySelector('.query-edit') as HTMLElement;
            if (editElement) {
              const nodeId = editElement.id.replace('query-edit-', '');
              window.saveQuery?.(nodeId);
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
    }
  }, [data.onUpdateParameters]);

  // Generate unique CSS class name for this node type
  const nodeTypeClass = `custom-node-${nodeSchema.node_id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Inject custom CSS if provided
  React.useEffect(() => {
    if (styling.custom_css) {
      const styleId = `node-style-${nodeSchema.node_id}`;
      let styleElement = document.getElementById(styleId);

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      // Replace node type placeholder with actual class name
      const processedCSS = styling.custom_css.replace(/\.node-type/g, `.${nodeTypeClass}`);
      styleElement.textContent = processedCSS;
    }
  }, [styling.custom_css, nodeTypeClass]);


  // Build dynamic styles based on backend configuration
  const nodeStyles = {
    backgroundColor: styling.background_color || (selected ? '#2a2a2a' : '#2a2a2a'),
    borderColor: styling.border_color || (selected ? '#3b82f6' : '#404040'),
    color: styling.text_color || '#ffffff',
    width: styling.width ? `${styling.width}px` : 'auto',
    height: styling.height ? `${styling.height}px` : 'auto',
    ...(styling.inline_styles ? JSON.parse(styling.inline_styles) : {})
  };

  // Determine shape-based styling
  const getShapeClasses = () => {
    const baseClasses = 'transition-all duration-200';
    
    switch (styling.shape) {
      case 'circle':
        return `${baseClasses} rounded-full flex items-center justify-center`;
      case 'rounded':
        return `${baseClasses} rounded-xl`;
      case 'custom':
        return baseClasses;
      case 'rectangle':
      default:
        return `${baseClasses} rounded-lg`;
    }
  };

  // Render custom HTML template if provided
  const renderCustomHTML = () => {
    if (!styling.html_template) return null;
    
    // Replace placeholders with actual values
    let html = styling.html_template
      .replace(/\{\{nodeName\}\}/g, nodeSchema.name)
      .replace(/\{\{nodeDescription\}\}/g, nodeSchema.description)
      .replace(/\{\{subtitle\}\}/g, styling.subtitle || '')
      .replace(/\{\{icon\}\}/g, styling.icon || '')
      .replace(/\{\{isExecuting\}\}/g, isExecuting ? 'executing' : '')
      .replace(/\{\{selected\}\}/g, selected ? 'selected' : '')
      .replace(/\{\{node_id\}\}/g, nodeId || ''); // Add node_id replacement
    
    // Replace parameter placeholders
    Object.entries(parameters).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value || ''));
    });
    
    // Replace data placeholders (like response_content from execution results)
    if (data.response_content) {
      html = html.replace(/\{\{response_content\}\}/g, String(data.response_content || ''));
    }
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Render icon based on type
  const renderIcon = () => {
    if (!styling.icon) return null;

    // Check if it's an SVG string
    if (styling.icon.startsWith('<svg')) {
      return (
        <div 
          className="w-6 h-6 flex-shrink-0"
          dangerouslySetInnerHTML={{ __html: styling.icon }}
        />
      );
    }
    
    // Check if it's an image URL
    if (styling.icon.startsWith('http') || styling.icon.startsWith('/')) {
      return (
        <img 
          src={styling.icon} 
          alt="Node icon" 
          className="w-6 h-6 flex-shrink-0 object-contain"
        />
      );
    }
    
    // Treat as emoji or text
    return (
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-lg">
        {styling.icon}
      </div>
    );
  };

  // If custom HTML template is provided, use it
  if (styling.html_template) {
    return (
      <div 
        className={`${nodeTypeClass} ${styling.css_classes || ''} ${
          isExecuting ? 'ring-2 ring-green-400 ring-opacity-50' : ''
        } ${selected ? 'shadow-xl border-blue-500' : 'hover:shadow-xl hover:border-gray-500'}`}
        style={nodeStyles}
        onClick={handleNodeClick}
      >
        {/* Input Handles */}
        {nodeSchema.inputs.map((input, index) => (
          <Handle
            key={`input-${input.name}`}
            type="target"
            position={Position.Left}
            id={`input-${input.name}`}
            style={{
              background: input.required ? '#3b82f6' : '#4a4a4a',
              border: input.required ? '2px solid #93c5fd' : '2px solid #666666',
              width: '12px',
              height: '12px',
              left: '-8px',
              top: `${((index + 1) / (nodeSchema.inputs.length + 1)) * 100}%`,
            }}
            title={`${input.name}${input.required ? ' (Required)' : ' (Optional)'}: ${input.description}`}
          />
        ))}

        {/* Custom HTML Content */}
        {renderCustomHTML()}

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

        {/* Delete Button - positioned at top-right corner */}
        {onDelete && nodeId && selected && (
          <div 
            className="absolute z-10 pointer-events-auto"
            style={{
              top: '-6px',
              right: '-6px',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(nodeId);
              }}
              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
              title="Delete node"
            >
              <svg className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default node rendering with backend-configurable styling
  return (
    <div 
      className={`${nodeTypeClass} ${styling.css_classes || ''} ${getShapeClasses()} px-4 py-3 shadow-lg border-2 min-w-[200px] relative ${
        isExecuting ? 'ring-2 ring-green-400 ring-opacity-50' : ''
      } ${selected ? 'shadow-xl border-blue-500' : 'hover:shadow-xl hover:border-gray-500'}`}
      style={nodeStyles}
      onClick={handleNodeClick}
    >
      {/* Execution Indicator */}
      {isExecuting && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      )}
      
      {/* Delete Button - positioned at top-right corner */}
      {onDelete && nodeId && selected && (
        <div 
          className="absolute z-10 pointer-events-auto"
          style={{
            top: '-6px',
            right: '-6px',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(nodeId);
            }}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            title="Delete node"
          >
            <svg className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Input Handles */}
      {nodeSchema.inputs.map((input, index) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={`input-${input.name}`}
          style={{
            background: input.required ? '#3b82f6' : '#4a4a4a',
            border: input.required ? '2px solid #93c5fd' : '2px solid #666666',
            width: '12px',
            height: '12px',
            left: '-8px',
            top: `${((index + 1) / (nodeSchema.inputs.length + 1)) * 100}%`,
          }}
          title={`${input.name}${input.required ? ' (Required)' : ' (Optional)'}: ${input.description}`}
        />
      ))}

      <div className={`flex items-center ${styling.icon_position === 'right' ? 'flex-row-reverse' : ''}`}>
        {/* Icon */}
        {styling.icon && styling.icon_position !== 'right' && (
          <div className="mr-2">
            {renderIcon()}
          </div>
        )}
        
        <div className="ml-2">
          <div className="text-lg font-bold" style={{ color: styling.text_color || '#ffffff' }}>
            {nodeSchema.name}
          </div>
          <div 
            className="text-xs uppercase tracking-wide" 
            style={{ color: styling.text_color ? `${styling.text_color}80` : '#d1d5db' }}
          >
            {styling.subtitle || 'Chatbot Node'}
          </div>
        </div>
        
        {/* Right-side icon */}
        {styling.icon && styling.icon_position === 'right' && (
          <div className="ml-2">
            {renderIcon()}
          </div>
        )}
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
