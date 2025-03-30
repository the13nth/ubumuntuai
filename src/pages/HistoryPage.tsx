import React from 'react';
import { QueryHistoryViewer } from '../components/QueryHistoryViewer';
import { QueryStats } from '../components/QueryStats';

export function HistoryPage() {
  return (
    <div className="min-h-screen bg-black pt-6 pb-28 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6">Firebase Query History</h1>
        
        <QueryStats />
        
        <div className="mt-8">
          <QueryHistoryViewer />
        </div>
      </div>
    </div>
  );
} 