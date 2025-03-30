import type { DashboardConfig } from '../agent';
import { saveQueryToFirebase } from './firebase';

const STORAGE_KEY = 'dashboard_config';
const CATEGORY_PREFIX = 'dashboard_config_category_';
// Use our local proxy server instead of directly accessing the API

interface StoredConfig extends DashboardConfig {
  activeCategory: string | null;
  created_at: string;
  configSource?: 'gemini' | 'firebase';
}

// Define the response interface for RAG API
interface RAGResponse {
  answer: string;
  query_embedding_visualization?: {
    x: number;
    y: number;
    z: number;
  };
  success?: boolean;
  error?: string;
  raw_response?: string;
}

/**
 * Processes a query and stores it in Firebase
 * This function replaces the original sendQueryToRAG that tried to connect to an external API
 * 
 * @param query The text query to process
 * @param category Optional category associated with the query
 * @returns Promise with a simulated RAG response
 */
export async function sendQueryToRAG(query: string, category?: string | null): Promise<RAGResponse> {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  try {
    console.log(`Processing query for Firebase: "${query}"`);
    
    // Get the current dashboard configuration to save as context
    const currentConfig = getLatestConfig();
    
    // Check if the query is related to UI updates
    const isUIQuery = query.toLowerCase().includes('layout') || 
                      query.toLowerCase().includes('display') || 
                      query.toLowerCase().includes('grid') ||
                      query.toLowerCase().includes('optimize') ||
                      query.toLowerCase().includes('screen');
    
    let rawResponse = '';
    
    if (isUIQuery) {
      // For UI-related queries, generate a mock raw response that would come from the agent
      rawResponse = `
{
  "cols": ${Math.min(Math.max(2, Math.floor(Math.random() * 6) + 3), 12)},
  "rows": ${Math.min(Math.max(2, Math.floor(Math.random() * 10) + 3), 20)},
  "rowHeight": ${Math.min(Math.max(40, Math.floor(Math.random() * 50) + 50), 200)},
  "margin": [${Math.floor(Math.random() * 10) + 4}, ${Math.floor(Math.random() * 10) + 4}]
}`;
    }
    
    // Generate a simulated response
    const simulatedResponse: RAGResponse = {
      success: true,
      answer: `Processed query: "${query}"${category ? ` for category: ${category}` : ''}`,
      query_embedding_visualization: {
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      },
      raw_response: rawResponse
    };
    
    // Save the query and response to Firebase with the current dashboard configuration
    await saveQueryToFirebase(
      query,
      simulatedResponse,
      {
        category,
        source: 'dashboard',
        userAgent: navigator.userAgent,
        success: true,
        dashboardContext: currentConfig ? {
          cols: currentConfig.cols,
          rows: currentConfig.rows,
          rowHeight: currentConfig.rowHeight,
          margin: currentConfig.margin,
          activeCategory: currentConfig.activeCategory,
          numApps: currentConfig.apps.length
        } : null
      }
    );
    
    console.log('Query saved to Firebase successfully');
    return simulatedResponse;
  } catch (error: any) {
    console.error(`Error processing query: ${error.message}`);
    
    // Get the current dashboard configuration to save as context
    const currentConfig = getLatestConfig();
    
    // Save the error to Firebase as well
    try {
      await saveQueryToFirebase(
        query,
        { error: error.message },
        {
          category,
          source: 'dashboard',
          userAgent: navigator.userAgent,
          success: false,
          dashboardContext: currentConfig ? {
            cols: currentConfig.cols,
            rows: currentConfig.rows,
            rowHeight: currentConfig.rowHeight,
            margin: currentConfig.margin,
            activeCategory: currentConfig.activeCategory,
            numApps: currentConfig.apps.length
          } : null
        }
      );
    } catch (fbError) {
      console.error('Failed to save error to Firebase:', fbError);
    }
    
    // Return a properly structured error response
    return {
      answer: `Error: ${error.message}`,
      error: error.message
    };
  }
}

export function saveConfig(config: DashboardConfig, category: string | null = null, source: 'gemini' | 'firebase' = 'gemini'): void {
  const key = category ? `${CATEGORY_PREFIX}${category}` : STORAGE_KEY;
  const storedConfig: StoredConfig = {
    ...config,
    activeCategory: category,
    created_at: new Date().toISOString(),
    configSource: source
  };
  localStorage.setItem(key, JSON.stringify(storedConfig));
  // Also update the latest config
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConfig));
}

export function getLatestConfig(): (DashboardConfig & { activeCategory: string | null; configSource?: 'gemini' | 'firebase' }) | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    return {
      cols: parsed.cols,
      rows: parsed.rows,
      rowHeight: parsed.rowHeight,
      margin: parsed.margin,
      layouts: parsed.layouts,
      apps: parsed.apps,
      activeCategory: parsed.activeCategory,
      configSource: parsed.configSource
    };
  } catch (error) {
    console.error('Error parsing config:', error);
    return null;
  }
}

export function getConfigByCategory(category: string | null): (DashboardConfig & { activeCategory: string | null }) | null {
  if (!category) return getLatestConfig();
  
  const key = `${CATEGORY_PREFIX}${category}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    return {
      cols: parsed.cols,
      rows: parsed.rows,
      rowHeight: parsed.rowHeight,
      margin: parsed.margin,
      layouts: parsed.layouts,
      apps: parsed.apps,
      activeCategory: parsed.activeCategory
    };
  } catch (error) {
    console.error('Error parsing category config:', error);
    return null;
  }
}

export function cleanupOldConfigs(): void {
  // No cleanup needed for localStorage as we only keep one config per category
  return;
} 