import React, { useState, useEffect } from 'react';
import { getRecentQueries } from '../lib/firebase';

interface QueryRecord {
  id: string;
  query: string;
  response: any;
  timestamp: any;
  category?: string | null;
  source?: string;
  success: boolean;
}

interface CategoryCount {
  category: string;
  count: number;
}

export function QueryStats() {
  const [totalQueries, setTotalQueries] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [topCategories, setTopCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const allQueries = await getRecentQueries(100); // Get up to 100 queries for stats
        const queries = allQueries as QueryRecord[];
        
        // Calculate total queries
        setTotalQueries(queries.length);
        
        // Calculate success rate
        const successfulQueries = queries.filter(q => q.success).length;
        setSuccessRate(queries.length > 0 ? (successfulQueries / queries.length) * 100 : 0);
        
        // Calculate category distribution
        const categoryMap = new Map<string, number>();
        queries.forEach(query => {
          const category = query.category || 'uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });
        
        // Sort categories by count
        const sortedCategories = Array.from(categoryMap.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Take top 5
        
        setTopCategories(sortedCategories);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching query stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-zinc-900 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-zinc-200 mb-4">Query Statistics</h2>
      
      {loading ? (
        <p className="text-zinc-400">Loading statistics...</p>
      ) : error ? (
        <div className="p-3 bg-red-900/50 text-red-200 rounded-md">
          Error loading stats: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-800 rounded-md">
            <p className="text-zinc-500 text-sm">Total Queries</p>
            <p className="text-zinc-200 text-2xl font-bold">{totalQueries}</p>
          </div>
          
          <div className="p-4 bg-zinc-800 rounded-md">
            <p className="text-zinc-500 text-sm">Success Rate</p>
            <p className="text-zinc-200 text-2xl font-bold">{successRate.toFixed(1)}%</p>
          </div>
          
          <div className="p-4 bg-zinc-800 rounded-md">
            <p className="text-zinc-500 text-sm">Top Categories</p>
            <div className="mt-2 space-y-1">
              {topCategories.length > 0 ? (
                topCategories.map(({ category, count }) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-zinc-300">{category}</span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400">No categories found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 