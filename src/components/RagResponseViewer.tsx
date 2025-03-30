import { useState, useEffect } from 'react';
import { getRecentResponses } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { updateDashboardConfig, type DashboardConfig } from '../agent';
import { saveConfig, getLatestConfig, getConfigByCategory } from '../lib/db';

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
    dashboardConfig?: {
      cols: number;
      rows: number;
      rowHeight: number;
      margin: [number, number];
      activeCategory: string | null;
      numApps: number;
    };
    raw_response?: string;
  };
  dashboardContext?: {
    cols: number;
    rows: number;
    rowHeight: number;
    margin: [number, number];
    activeCategory: string | null;
    numApps: number;
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

export default function RagResponseViewer() {
  const [queries, setQueries] = useState<RAGQuery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState<boolean>(false);
  const [applyingConfig, setApplyingConfig] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        setError(null);
        setNoData(false);
        
        const results = await getRecentResponses(50); // Get last 50 responses
        
        console.log('Raw Firebase Response Results:', results);
        
        if (!results || results.length === 0) {
          setNoData(true);
          console.log('No data found in Firebase rag_responses collection');
        } else {
          // Log the structure of the first item to help with debugging
          if (results[0]) {
            const firstResult = results[0] as any;
            console.log('First response structure:', {
              id: firstResult.id,
              query: firstResult.query,
              hasTimestamp: !!firstResult.timestamp,
              hasResponse: !!firstResult.response,
              responseKeys: firstResult.response ? Object.keys(firstResult.response) : [],
              raw_response: firstResult.response?.raw_response,
              category: firstResult.category,
              success: firstResult.success
            });

            // Log the entire first result for debugging
            console.log('Complete first document:', JSON.stringify(firstResult, null, 2));
          }
          
          // Filter out any entries that don't have a valid structure for rag_responses
          const validQueries = results.filter((q: any) => 
            q && q.id && 
            q.timestamp && 
            q.response && 
            (typeof q.response === 'object') &&
            (q.query || q.original_query_id) // Either has query or reference to original
          );
          
          console.log(`Found ${validQueries.length} valid responses out of ${results.length} total entries in rag_responses`);
          
          if (validQueries.length === 0) {
            setNoData(true);
          } else {
            // Map over validQueries to ensure raw_response is accessible
            const processedQueries = validQueries.map((q: any) => {
              // For debugging - log any raw_response that is present
              if (q.raw_response) {
                console.log(`Direct raw_response found in document ${q.id}`);
              }
              else if (q.response?.raw_response) {
                console.log(`nested raw_response found in document ${q.id}`);
              }
              
              return {
                ...q,
                // If raw_response exists at the top level, copy it into the response object
                response: {
                  ...q.response,
                  // Ensure raw_response is accessible in response object
                  raw_response: q.raw_response || q.response?.raw_response
                }
              };
            });
            
            setQueries(processedQueries as RAGQuery[]);
          }
        }
      } catch (error) {
        console.error('Error fetching responses:', error);
        setError('Failed to load responses from Firebase rag_responses collection.');
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  const handleApplyConfig = async (query: RAGQuery) => {
    if (!query.dashboardContext || !query.response.raw_response) return;
    
    try {
      setApplyingConfig(query.id);
      
      // Get the raw JSON from the response.raw_response
      const responseText = query.response.raw_response.trim();
      let configValues;
      
      try {
        // First handle the case where it's a string with escaped characters
        const unescaped = responseText.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        // Then remove any outer quotes
        const unquoted = unescaped.replace(/^['"]|['"]$/g, '');
        // Parse the JSON string
        configValues = JSON.parse(unquoted);
        console.log('Successfully parsed raw_response:', configValues);
      } catch (parseError) {
        console.error('Error parsing raw_response:', parseError);
        throw new Error("Failed to parse configuration JSON");
      }
      
      // Get the current configuration from localStorage to ensure we have the latest app data
      const currentConfig = getLatestConfig();
      if (!currentConfig) {
        throw new Error("Could not retrieve current dashboard configuration");
      }
      
      // Apply the new config values from the raw response
      const newConfig: DashboardConfig = {
        cols: configValues.cols || currentConfig.cols,
        rows: configValues.rows || currentConfig.rows,
        rowHeight: configValues.rowHeight || currentConfig.rowHeight,
        margin: configValues.margin || currentConfig.margin,
        apps: currentConfig.apps || [],
        layouts: currentConfig.layouts || []
      };
      
      // Update the layouts to match the new grid dimensions
      if (newConfig.layouts && newConfig.layouts.length > 0) {
        newConfig.layouts = newConfig.layouts.map((layout: any) => ({
          ...layout,
          maxW: newConfig.cols,
          maxH: newConfig.rows
        }));
      }
      
      // Save the config to localStorage, preserving the category and marking it as from Firebase
      saveConfig(newConfig, currentConfig.activeCategory, 'firebase');
      
      // Show success message
      alert(`Configuration from Firebase applied! Please navigate to the Home tab to see the changes.`);
    } catch (error) {
      console.error("Error applying configuration:", error);
      alert(`Failed to apply configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setApplyingConfig(null);
    }
  };

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
        Showing data directly from Firebase Firestore collection: rag_responses
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
          <h3 className="text-xl font-medium text-zinc-100 mb-2">No RAG responses found</h3>
          <p className="text-zinc-400">
            There are no responses in the Firebase rag_responses collection. Try making some dashboard queries first.
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
                      <Tabs defaultValue="generative-ui" className="text-zinc-100">
                        <TabsList className="bg-zinc-900">
                          <TabsTrigger value="generative-ui" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">Generative UI</TabsTrigger>
                          <TabsTrigger value="context" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">Dashboard Context</TabsTrigger>
                          {query.response.query_embedding_visualization && (
                            <TabsTrigger value="visualization" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">Visualization</TabsTrigger>
                          )}
                        </TabsList>
                        
                        <TabsContent value="generative-ui" className="p-4 bg-zinc-900 rounded-md mt-3">
                          <div className="space-y-4">
                            <h4 className="font-medium text-zinc-200 mb-1">Raw Response</h4>
                            
                            {query.response.error ? (
                              <div className="text-red-400 p-4 bg-zinc-800 rounded border border-zinc-700">
                                <span>{query.response.error}</span>
                              </div>
                            ) : query.response.raw_response ? (
                              <>
                                <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-800 p-4 rounded border border-zinc-700 max-h-60 overflow-y-auto">
                                  {(() => {
                                    try {
                                      // Remove outer quotes if they exist and unescape the string
                                      const rawStr = query.response.raw_response.trim();
                                      // First handle the case where it's a string with escaped characters
                                      const unescaped = rawStr.replace(/\\n/g, '\n').replace(/\\"/g, '"');
                                      // Then remove any outer quotes
                                      const unquoted = unescaped.replace(/^['"]|['"]$/g, '');
                                      // Parse the JSON string
                                      const parsed = JSON.parse(unquoted);
                                      // Format it nicely
                                      return JSON.stringify(parsed, null, 2);
                                    } catch (error) {
                                      console.error('Error parsing raw_response:', error, '\nRaw string:', query.response.raw_response);
                                      // If parsing fails, show the raw string for debugging
                                      return `Failed to parse JSON. Raw string:\n${query.response.raw_response}`;
                                    }
                                  })()}
                                </pre>
                                <div className="flex justify-end mt-3">
                                  <button
                                    onClick={() => handleApplyConfig(query)}
                                    disabled={applyingConfig === query.id}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                                      applyingConfig === query.id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    {applyingConfig === query.id ? 'Applying...' : 'Apply Configuration'}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="p-4 bg-zinc-800 rounded border border-zinc-700 text-zinc-400 text-sm">
                                No raw response data available for this query
                                <details className="mt-2 text-xs">
                                  <summary className="cursor-pointer">Show debug info</summary>
                                  <div className="mt-2 p-2 bg-zinc-700 rounded">
                                    <p>Response keys: {Object.keys(query.response).join(', ')}</p>
                                    <p>Top-level keys: {Object.keys(query).join(', ')}</p>
                                    <p>Has raw_response: {String(!!query.response.raw_response)}</p>
                                    <p>Has raw_response at top level: {String(!!(query as any).raw_response)}</p>
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="context" className="p-4 bg-zinc-900 rounded-md mt-3">
                          <h4 className="font-medium mb-2 text-zinc-200">Dashboard Context</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-sm text-zinc-300">Before Query</h5>
                              <pre className="whitespace-pre-wrap text-sm bg-zinc-800 p-2 rounded border border-zinc-700 text-zinc-300">
                                {JSON.stringify(query.dashboardContext || {}, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm text-zinc-300">After Response</h5>
                              <pre className="whitespace-pre-wrap text-sm bg-zinc-800 p-2 rounded border border-zinc-700 text-zinc-300">
                                {JSON.stringify(query.response.dashboardConfig || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </TabsContent>

                        {query.response.query_embedding_visualization && (
                          <TabsContent value="visualization" className="p-4 bg-zinc-900 rounded-md mt-3 h-60">
                            <div className="text-center">
                              <div className="font-medium text-zinc-200">Embedding Visualization</div>
                              <div className="text-sm text-zinc-400 mb-2">
                                X: {query.response.query_embedding_visualization.x.toFixed(4)}, 
                                Y: {query.response.query_embedding_visualization.y.toFixed(4)}, 
                                Z: {query.response.query_embedding_visualization.z.toFixed(4)}
                              </div>
                              <div className="bg-zinc-800 p-4 rounded-md shadow-sm h-40 flex items-center justify-center border border-zinc-700">
                                <div 
                                  className="w-4 h-4 rounded-full bg-blue-500"
                                  style={{
                                    marginLeft: `${query.response.query_embedding_visualization.x * 100}%`,
                                    marginTop: `${query.response.query_embedding_visualization.y * 100}%`,
                                    opacity: query.response.query_embedding_visualization.z
                                  }}
                                ></div>
                              </div>
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>
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