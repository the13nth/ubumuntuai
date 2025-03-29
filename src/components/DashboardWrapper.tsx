import { useState } from 'react';
import { AppDashboard } from './AppDashboard';
import { updateDashboardConfig, type DashboardConfig } from '../agent';

export function DashboardWrapper() {
  const [config, setConfig] = useState<DashboardConfig>({
    cols: 5,
    rows: 10,
    rowHeight: 60,
    margin: [6, 6],
    layouts: [],
    apps: [] // This will be populated from AppDashboard
  });

  const [input, setInput] = useState('');

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    const newConfig = await updateDashboardConfig(input, config);
    setConfig(newConfig);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-black">
      <AppDashboard defaultConfig={config} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 p-4">
        <div className="max-w-xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe how to update the dashboard..."
            className="flex-1 p-2 bg-zinc-800 text-zinc-300 rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
} 