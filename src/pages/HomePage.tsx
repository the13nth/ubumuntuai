import { getLatestConfig } from '../lib/db';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function HomePage() {
  const config = getLatestConfig();
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        {config?.configSource && (
          <div className={`px-3 py-1 rounded text-sm ${
            config.configSource === 'firebase' 
              ? 'bg-blue-600 text-white' 
              : 'bg-emerald-600 text-white'
          }`}>
            Configuration from {config.configSource === 'firebase' ? 'Firebase RAG' : 'Gemini AI'}
          </div>
        )}
      </div>
      
      {config ? (
        <ResponsiveGridLayout
          // ... existing props ...
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
} 