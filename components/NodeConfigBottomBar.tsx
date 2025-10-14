'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';

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
    <div className="bg-gray-700 border-t border-gray-600 p-4">
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

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodeSchema.parameters.map((param) => (
            <div key={param.name} className="space-y-2">
              <label className={`block text-sm font-medium ${
                param.required ? 'text-white' : 'text-gray-400'
              }`}>
                {param.name}
                {param.required && <span className="text-red-400 ml-1">*</span>}
              </label>

              {param.type === 'string' && (
                <div>
                  {param.options ? (
                    <select
                      value={parameters[param.name] || param.default_value || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        param.required
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300'
                      }`}
                    >
                      <option value="">Select {param.name}</option>
                      {param.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={parameters[param.name] || param.default_value || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={`Enter ${param.name}`}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        param.required
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-300'
                          : 'bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-500'
                      }`}
                    />
                  )}
                </div>
              )}

              {param.type === 'integer' && (
                <input
                  type="number"
                  value={parameters[param.name] || param.default_value || ''}
                  onChange={(e) => handleParameterChange(param.name, parseInt(e.target.value) || 0)}
                  placeholder={`Enter ${param.name}`}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    param.required
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-300'
                      : 'bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-500'
                  }`}
                />
              )}

              {param.type === 'float' && (
                <input
                  type="number"
                  step="0.1"
                  value={parameters[param.name] || param.default_value || ''}
                  onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value) || 0)}
                  placeholder={`Enter ${param.name}`}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    param.required
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-300'
                      : 'bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-500'
                  }`}
                />
              )}

              <p className={`text-xs ${
                param.required ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {param.description}
              </p>
            </div>
          ))}
        </div>

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
