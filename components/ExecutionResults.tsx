'use client';

import { useState } from 'react';

interface ExecutionResultsProps {
  results: any;
  onClose: () => void;
}

export default function ExecutionResults({ results, onClose }: ExecutionResultsProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'errors'>('results');

  if (!results) return null;

  const isSuccess = results.success !== false;
  const data = results.data || {};
  const hasErrors = Object.keys(data.errors || {}).length > 0;
  const hasResults = Object.keys(data.response_inputs || {}).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden border border-[#404040]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#404040] bg-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Execution Results</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#404040] bg-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'results'
                ? 'text-white border-b-2 border-[#a78bfa] bg-[#2a2a2a]'
                : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Results ({Object.keys(data.response_inputs || {}).length})
          </button>
          {hasErrors && (
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'errors'
                  ? 'text-white border-b-2 border-red-500 bg-[#2a2a2a]'
                  : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Errors ({Object.keys(data.errors || {}).length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto bg-[#1a1a1a]">
          {!isSuccess ? (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
              <h3 className="text-red-300 font-medium mb-2">Execution Failed</h3>
              <p className="text-red-200 text-sm">{results.error || 'Unknown error occurred'}</p>
            </div>
          ) : (
            <>
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {hasResults && data?.response_inputs ? (
                    Object.entries(data.response_inputs).map(([nodeId, inputs]: [string, any]) => (
                      <div key={nodeId} className="bg-[#2a2a2a] border border-[#404040] rounded-lg p-4">
                        <h3 className="text-white font-medium mb-2">Response Node: {nodeId}</h3>
                        <div className="space-y-2">
                          {Object.entries(inputs || {}).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-start space-x-2">
                              <span className="text-gray-300 text-sm font-medium min-w-[100px]">{key}:</span>
                              <div className="flex-1">
                                {typeof value === 'object' ? (
                                  <pre className="text-gray-200 text-sm bg-[#1a1a1a] border border-[#404040] p-2 rounded overflow-x-auto">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  <span className="text-gray-200 text-sm">{String(value)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-300 text-center py-8">
                      No response data available
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'errors' && hasErrors && data?.errors && (
                <div className="space-y-4">
                  {Object.entries(data.errors).map(([nodeId, error]: [string, any]) => (
                    <div key={nodeId} className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
                      <h3 className="text-red-300 font-medium mb-2">Node: {nodeId}</h3>
                      <p className="text-red-200 text-sm">{String(error)}</p>
                    </div>
                  ))}
                </div>
              )}

              {isSuccess && !hasResults && !hasErrors && data && (
                <div className="text-gray-300 text-center py-8">
                  No execution data available
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#404040] bg-[#2a2a2a]">
          <div className="text-sm text-gray-300">
            Executed {data.executed_nodes?.length || 0} nodes
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(results, null, 2))}
              className="px-3 py-1 bg-[#404040] hover:bg-[#4a4a4a] text-white text-sm rounded transition-colors border border-[#666666]"
            >
              Copy Results
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
