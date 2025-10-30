'use client';

import React from 'react';
import { Panel } from '@xyflow/react';

interface CanvasToolbarProps {
  onSaveWorkflow: () => void;
  onSaveWorkflowToBackend: () => void;
  onLoadWorkflow: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExecute: () => void;
  isExecuting: boolean;
  hasNodes: boolean;
}

export default function CanvasToolbar({
  onSaveWorkflow,
  onSaveWorkflowToBackend,
  onLoadWorkflow,
  onExecute,
  isExecuting,
  hasNodes
}: CanvasToolbarProps) {
  return (
    <Panel position="top-center">
      <div className="bg-slate-800/90 backdrop-blur-md border border-slate-600/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
        
        {/* Save to Backend Button */}
        <button
          onClick={onSaveWorkflowToBackend}
          disabled={!hasNodes}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            !hasNodes
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/30'
              : 'bg-red-500 hover:bg-red-600 text-white border border-red-400/30 hover:border-red-300/50 shadow-lg hover:shadow-red-500/30 hover:scale-105'
          }`}
          title="Save workflow to backend (SQLite)"
        >
          Save
        </button>

        {/* Download JSON Button */}
        <button
          onClick={onSaveWorkflow}
          disabled={!hasNodes}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            !hasNodes
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/30'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600/50 hover:border-slate-500/70 shadow-lg hover:shadow-slate-500/20 hover:scale-105'
          }`}
          title="Download workflow as JSON file"
        >
          Download JSON
        </button>

        {/* Load Button */}
        <button
          onClick={() => document.getElementById('workflow-upload')?.click()}
          className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-sm font-medium transition-all duration-200 border border-slate-600/50 hover:border-slate-500/70 shadow-lg hover:shadow-slate-500/20 hover:scale-105"
          title="Load workflow from JSON file"
        >
          Load
        </button>

        {/* Hidden file input */}
        <input
          id="workflow-upload"
          type="file"
          accept=".json"
          onChange={onLoadWorkflow}
          style={{ display: 'none' }}
        />

        {/* Execute Button */}
        <button
          onClick={onExecute}
          disabled={isExecuting || !hasNodes}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isExecuting || !hasNodes
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/30'
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border border-red-400/30 hover:border-red-300/50 shadow-lg hover:shadow-red-500/40 hover:scale-105'
          }`}
        >
          {isExecuting ? 'Executing...' : 'Execute Workflow'}
        </button>
      </div>
    </Panel>
  );
}