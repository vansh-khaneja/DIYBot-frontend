'use client';

import React from 'react';
import { Panel } from '@xyflow/react';

interface CanvasAddButtonProps {
  onAddNode?: () => void;
}

export default function CanvasAddButton({ onAddNode }: CanvasAddButtonProps) {
  return (
    <Panel position="top-right">
      <button
        onClick={onAddNode}
        className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="Add new node"
      >
        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>
    </Panel>
  );
}
