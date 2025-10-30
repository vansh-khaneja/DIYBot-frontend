'use client';

import { useState } from 'react';

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

interface NodesData {
  nodes: string[];
  schemas: Record<string, NodeSchema>;
  total_count: number;
}

interface NodeSelectionSidebarProps {
  nodes: NodesData;
  onNodeSelect: (nodeType: string) => void;
  onClose: () => void;
}

export default function NodeSelectionSidebar({
  nodes,
  onNodeSelect,
  onClose
}: NodeSelectionSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = Object.values(nodes.schemas).filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render icon based on type
  const renderIcon = (styling: NodeSchema['styling']) => {
    if (!styling.icon) return null;

    // Check if it's an SVG string
    if (styling.icon.startsWith('<svg')) {
      return (
        <div 
          className="w-5 h-5 flex-shrink-0"
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
          className="w-5 h-5 flex-shrink-0 object-contain"
        />
      );
    }
    
    // Treat as emoji or text
    return (
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-sm">
        {styling.icon}
      </div>
    );
  };

  return (
    <div className="w-80 bg-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Add Node</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredNodes.map((node) => {
            const { styling } = node;
            const nodeStyles = {
              backgroundColor: styling.background_color || '#4b5563',
              borderColor: styling.border_color || '#6b7280',
              color: styling.text_color || '#ffffff',
              ...(styling.inline_styles ? JSON.parse(styling.inline_styles) : {})
            };

            return (
              <div
                key={node.node_id}
                onClick={() => onNodeSelect(node.node_id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors group border-2 ${styling.css_classes || ''}`}
                style={nodeStyles}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Icon */}
                    {styling.icon && (
                      <div className="mt-0.5">
                        {renderIcon(styling)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium group-hover:opacity-80 transition-opacity" style={{ color: styling.text_color || '#ffffff' }}>
                        {node.name}
                      </h3>
                      <p className="text-sm mt-1 line-clamp-2 opacity-80" style={{ color: styling.text_color || '#ffffff' }}>
                        {styling.subtitle || node.description.trim()}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs opacity-60" style={{ color: styling.text_color || '#ffffff' }}>
                        <span>{node.inputs.length} inputs</span>
                        <span>{node.outputs.length} outputs</span>
                      </div>
                    </div>
                  </div>
                  
                  <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: styling.text_color || '#ffffff' }}>
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
