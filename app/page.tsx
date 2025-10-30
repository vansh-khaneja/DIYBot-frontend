'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ProviderKey = 'TAVILY_API_KEY' | 'OPENAI_API_KEY' | 'GROQ_API_KEY';
type KeySelection = ProviderKey | 'CUSTOM';

function CredentialsTab() {
  const [items, setItems] = useState<{ key: string; label: string; value?: string; isPreset?: boolean }[]>([
    { key: 'TAVILY_API_KEY', label: 'Tavily', isPreset: true },
    { key: 'OPENAI_API_KEY', label: 'OpenAI', isPreset: true },
    { key: 'GROQ_API_KEY', label: 'Groq', isPreset: true },
  ]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedKey, setSelectedKey] = useState<KeySelection>('TAVILY_API_KEY');
  const [customKey, setCustomKey] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const STORAGE_KEY = 'diybot_credentials_status';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved: Record<string, boolean> = raw ? JSON.parse(raw) : {};
      setItems((prev) => prev.map((it) => (saved[it.key] ? { ...it, value: '********' } : it)));
    } catch {}
  }, []);

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(filter.toLowerCase()) || i.key.toLowerCase().includes(filter.toLowerCase())
  );

  const addOrUpdate = async () => {
    if (!value.trim()) return;
    const keyToSave = selectedKey === 'CUSTOM' ? customKey.trim() : (selectedKey as string);
    if (!keyToSave) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/v1/credentials/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToSave, value }),
      });
      if (!res.ok) throw new Error('Failed to save credential');
      setItems((prev) => {
        const exists = prev.some((it) => it.key === keyToSave);
        if (exists) {
          return prev.map((it) => (it.key === keyToSave ? { ...it, value: '********' } : it));
        }
        return [
          ...prev,
          { key: keyToSave, label: keyToSave, value: '********', isPreset: false },
        ];
      });
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const saved: Record<string, boolean> = raw ? JSON.parse(raw) : {};
        saved[keyToSave] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {}
      setShowModal(false);
      setValue('');
      setCustomKey('');
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (key: string) => {
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/v1/credentials/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error('Failed to delete credential');
      setItems((prev) => prev.map((it) => (it.key === key ? { ...it, value: undefined } : it)));
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const saved: Record<string, boolean> = raw ? JSON.parse(raw) : {};
        delete saved[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const configuredItems = items.filter((i) => i.value);
  const visibleItems = (configuredItems.length ? configuredItems : items).filter((i) =>
    i.label.toLowerCase().includes(filter.toLowerCase()) || i.key.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search credentials..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create new secret
        </button>
      </div>

      {configuredItems.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-700 rounded-lg">
          <div className="text-gray-300 text-lg mb-2">No credentials found</div>
          <p className="text-gray-500 mb-6">Create your first credential to get started</p>
          <button onClick={() => setShowModal(true)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">Create new secret</button>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Env Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {visibleItems.map((it) => (
                it.value ? (
                  <tr key={it.key} className="border-t border-gray-700">
                    <td className="px-6 py-3 text-white">{it.label}</td>
                    <td className="px-6 py-3 text-gray-300">{it.key}</td>
                    <td className="px-6 py-3 text-green-400">Configured</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        disabled={busy}
                        onClick={() => remove(it.key)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ) : null
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Create new secret</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {([
                {
                  key: 'CUSTOM',
                  label: 'Custom',
                  desc: 'Custom environment variables for your DIYBot functions',
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 00-5 5c0 1.03.31 1.99.85 2.78L2.29 14.34a1 1 0 000 1.41l6.96 6.96a1 1 0 001.41 0l5.56-5.56A5 5 0 1012 1zm7 5a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  ),
                },
                {
                  key: 'OPENAI_API_KEY',
                  label: 'OpenAI',
                  desc: 'Use the OpenAI API or Python package',
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  ),
                },
                {
                  key: 'GROQ_API_KEY',
                  label: 'Groq',
                  desc: 'Access Groq LPU-powered models',
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16H4z"/></svg>
                  ),
                },
                {
                  key: 'TAVILY_API_KEY',
                  label: 'Tavily',
                  desc: 'Web search results and summaries',
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a8 8 0 108-8h-2a6 6 0 11-6 6v2z"/></svg>
                  ),
                },
              ] as { key: KeySelection; label: string; desc: string; icon: JSX.Element }[]).map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedKey(p.key)}
                  className={`flex items-start space-x-3 p-4 rounded-xl border text-left ${selectedKey === p.key ? 'border-red-500 bg-gray-750/50' : 'border-gray-700 hover:border-gray-600'} bg-gray-800 transition-colors`}
                >
                  <div className={`mt-1 ${selectedKey === p.key ? 'text-red-400' : 'text-gray-300'}`}>{p.icon}</div>
                  <div>
                    <div className="text-white font-medium">{p.label}</div>
                    <div className="text-gray-400 text-sm">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Env Key</label>
                {selectedKey === 'CUSTOM' ? (
                  <input
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
                    placeholder="MY_SERVICE_API_KEY"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                  />
                ) : (
                  <input
                    value={selectedKey}
                    disabled
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Value</label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700">Cancel</button>
              <button disabled={busy || !value || (selectedKey === 'CUSTOM' && !customKey)} onClick={addOrUpdate} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowsTab({ userName }: { userName: string }) {
  const [items, setItems] = useState<{ id: number; name: string; created_at: string }[]>([]);
  const [showLoad, setShowLoad] = useState(false);
  const [name, setName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const saveWorkflow = async () => {
    try {
      setBusy(true);
      const payload = { name: name || 'Untitled Workflow', data: JSON.parse(jsonText || '{}') };
      const res = await fetch(`${API_BASE}/api/v1/workflows/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save workflow');
      setShowLoad(false); setName(''); setJsonText('');
      await fetchWorkflows();
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };

  const downloadWorkflow = () => {
    try {
      const payload = { name: name || 'Untitled Workflow', data: JSON.parse(jsonText || '{}') };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safe = (name || 'workflow').replace(/[^a-z0-9-_]+/gi, '-');
      a.download = `${safe}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-2xl font-semibold text-white mb-2">Welcome {userName}!</h2>
        <p className="text-gray-400 mb-8">Create your first workflow</p>
        <div className="max-w-sm mx-auto">
          <button onClick={() => setShowLoad(true)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-8 hover:bg-gray-700 transition-colors">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
            </div>
            <h3 className="text-lg font-medium text-white">Load a workflow</h3>
          </button>
        </div>

        {showLoad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Load workflow</h3>
                <button onClick={() => setShowLoad(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Workflow" className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Workflow JSON</label>
                  <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={10} placeholder={`{\n  "nodes": {},\n  "edges": []\n}`} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowLoad(false)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700">Cancel</button>
                <button disabled={!jsonText.trim()} onClick={downloadWorkflow} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Save locally</button>
                <button disabled={busy || !jsonText.trim()} onClick={saveWorkflow} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Saved Workflows</h3>
        <button onClick={() => setShowLoad(true)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">Load workflow</button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="border-t border-gray-700 hover:bg-gray-750/30 cursor-pointer" onClick={() => { window.location.href = `/workflow?id=${w.id}`; }}>
                <td className="px-6 py-3 text-white underline">{w.name}</td>
                <td className="px-6 py-3 text-gray-300">{new Date(w.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLoad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Load workflow</h3>
              <button onClick={() => setShowLoad(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Workflow" className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Workflow JSON</label>
                <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={10} placeholder={`{\n  "nodes": {},\n  "edges": []\n}`} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowLoad(false)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700">Cancel</button>
              <button disabled={!jsonText.trim()} onClick={downloadWorkflow} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Save locally</button>
              <button disabled={busy || !jsonText.trim()} onClick={saveWorkflow} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface WelcomeFormProps {
  onSubmit: (name: string) => void;
}

function WelcomeForm({ onSubmit }: WelcomeFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-gray-600 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-white">DIYBot</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white text-center mb-6">Welcome to DIYBot!</h2>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="text-xl font-semibold text-white">DIYBot</span>
        </div>
      </div>

      {/* Add Button */}
      <div className="p-4">
        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors flex items-center justify-center">
          <span className="text-xl">+</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4">
        <nav className="space-y-2">
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 bg-gray-700 text-white rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Overview</span>
          </a>
        </nav>
      </div>

      {/* Collapse Button */}
      <div className="p-4 border-t border-gray-700">
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MainContent({ userName }: { userName: string }) {
  const [activeTab, setActiveTab] = useState('workflows');

  const tabs = [
    { id: 'workflows', label: 'Workflows' },
    { id: 'credentials', label: 'Credentials' },
    { id: 'executions', label: 'Executions' }
  ];

  return (
    <div className="flex-1 bg-black">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center space-x-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Overview</span>
            </h1>
            <p className="text-gray-400 mt-1">All the workflows, credentials and executions you have access to.</p>
          </div>
          <a href="/workflow" className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">Create Workflow</a>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-700">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'workflows' && (
          <WorkflowsTab userName={userName} />
        )}

        {activeTab === 'credentials' && <CredentialsTab />}

        {activeTab === 'executions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span>Filters</span>
              </button>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="auto-refresh" className="rounded" />
                <label htmlFor="auto-refresh" className="text-white">Auto refresh</label>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Workflow</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Started</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Run Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Exec. ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Triggered By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800">
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No executions
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [userName, setUserName] = useState<string>('');
  const [showWelcomeForm, setShowWelcomeForm] = useState(false);

  useEffect(() => {
    // Check if user name exists in cookies
    const savedName = document.cookie
      .split('; ')
      .find(row => row.startsWith('diybot_username='))
      ?.split('=')[1];

    if (savedName) {
      setUserName(decodeURIComponent(savedName));
    } else {
      setShowWelcomeForm(true);
    }
  }, []);

  const handleWelcomeSubmit = (name: string) => {
    setUserName(name);
    setShowWelcomeForm(false);
    // Save to cookies
    document.cookie = `diybot_username=${encodeURIComponent(name)}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
  };

  if (showWelcomeForm) {
    return <WelcomeForm onSubmit={handleWelcomeSubmit} />;
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      <MainContent userName={userName} />
    </div>
  );
}