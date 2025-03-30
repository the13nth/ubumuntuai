import { useState, useEffect } from 'react';
import { getRecentQueries } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface RAGQuery {
  id: string;
  query: string;
  response: {
    answer: string;
    query_embedding_visualization?: {
      x: number;
      y: number;
      z: number;
    };
    success?: boolean;
    error?: string;
  };
  timestamp: any;
  category: string | null;
  source: string;
  success: boolean;
}

// Utility function to handle both Firestore timestamps and regular Date objects
function formatDate(timestamp: any): Date {
  // If it's a Firestore timestamp with toDate() method
  if (timestamp?.toDate instanceof Function) {
    return timestamp.toDate();
  }
  // If it's already a Date object
  else if (timestamp instanceof Date) {
    return timestamp;
  }
  // If it's a number (timestamp in milliseconds)
  else if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  // Default to current date if we can't parse
  return new Date();
}

export function QueryHistoryViewer() {
  const [queries, setQueries] = useState<RAGQuery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState<boolean>(false);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        setError(null);
        setNoData(false);
        
        const results = await getRecentQueries(50); // Get last 50 queries
        
        console.log('Raw Firebase Query Results:', results);
        
        if (!results || results.length === 0) {
          setNoData(true);
          console.log('No data found in Firebase rag_queries collection');
        } else {
          // Log the structure of the first item to help with debugging
          if (results[0]) {
            const firstResult = results[0] as any;
            console.log('First query structure:', {
              id: firstResult.id,
              query: firstResult.query,
              hasTimestamp: !!firstResult.timestamp,
              hasResponse: !!firstResult.response,
              responseKeys: firstResult.response ? Object.keys(firstResult.response) : [],
              category: firstResult.category,
              success: firstResult.success
            });
          }
          
          // Filter out any entries that don't have a valid structure for rag_queries
          const validQueries = results.filter((q: any) => 
            q && q.id && 
            q.timestamp && 
            q.query &&
            typeof q.query === 'string'
          );
          
          console.log(`Found ${validQueries.length} valid queries out of ${results.length} total entries in rag_queries`);
          
          if (validQueries.length === 0) {
            setNoData(true);
          } else {
            setQueries(validQueries as RAGQuery[]);
          }
        }
      } catch (error) {
        console.error('Error fetching queries:', error);
        setError('Failed to load queries from Firebase rag_queries collection.');
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  const categories = ['all', ...new Set(queries.map(q => q.category).filter(Boolean))];

  const filteredQueries = activeCategory === 'all' || !activeCategory
    ? queries
    : queries.filter(q => q.category === activeCategory);

  // Group queries by day for display
  const queryGroups = filteredQueries.reduce((groups: Record<string, RAGQuery[]>, query) => {
    // Format date as YYYY-MM-DD
    const date = formatDate(query.timestamp);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(query);
    return groups;
  }, {});

  return (
    <div className="text-zinc-100">
      <div className="mb-4 px-2 py-1 bg-zinc-800/50 rounded text-xs text-zinc-400">
        Showing data directly from Firebase Firestore collection: rag_queries
      </div>
      
      {error && (
        <div className="bg-zinc-800 border border-red-400 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="flex justify-between items-center mb-6">
          <div>
            {categories.length > 1 && (
              <div>
                <h2 className="text-lg font-semibold mb-2 text-zinc-100">Filter by Category</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Badge 
                      key={category || 'all'} 
                      variant={activeCategory === category ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setActiveCategory(category)}
                    >
                      {category || 'all'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-zinc-400">
            {filteredQueries.length} entries {activeCategory ? `(category: ${activeCategory})` : '(all categories)'}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400"></div>
        </div>
      ) : noData || filteredQueries.length === 0 ? (
        <div className="text-center py-8 bg-zinc-800 rounded-lg p-10">
          <h3 className="text-xl font-medium text-zinc-100 mb-2">No queries found</h3>
          <p className="text-zinc-400">
            There are no queries in the Firebase rag_queries collection.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(queryGroups).sort((a, b) => b[0].localeCompare(a[0])).map(([date, dayQueries]) => (
            <div key={date}>
              <h3 className="text-lg font-medium mb-4 text-zinc-100">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
              <div className="space-y-4">
                {dayQueries.sort((a, b) => {
                  const dateA = formatDate(a.timestamp);
                  const dateB = formatDate(b.timestamp);
                  return dateB.getTime() - dateA.getTime();
                }).map((query) => (
                  <Card key={query.id} className={`bg-zinc-800 border-zinc-700 ${query.success ? "border-l-green-500 border-l-4" : "border-l-red-500 border-l-4"}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md font-medium text-zinc-100">
                          {query.query}
                        </CardTitle>
                        <Badge variant={query.success ? "default" : "destructive"}>
                          {query.success ? "Success" : "Error"}
                        </Badge>
                      </div>
                      <div className="text-sm text-zinc-400">
                        {formatDate(query.timestamp).toLocaleTimeString()}
                        {query.category && (
                          <Badge variant="outline" className="ml-2">
                            {query.category}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="p-4 bg-zinc-900 rounded-md">
                        <h4 className="font-medium text-zinc-200 mb-2">Response</h4>
                        <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-800 p-3 rounded border border-zinc-700">
                          {query.response.error ? 
                            <span className="text-red-400">{query.response.error}</span> : 
                            query.response.answer
                          }
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 