import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppDashboard } from './AppDashboard';
import { updateDashboardConfig, type DashboardConfig } from '../agent';
import { IconBulb, IconFilter, IconSettings } from '@tabler/icons-react';
import { saveConfig, getLatestConfig, getConfigByCategory, cleanupOldConfigs } from '../lib/db';

const DEFAULT_APPS = [
  { name: "Facebook", percentage: 29, category: "social" },
  { name: "Google Mail", percentage: 13, category: "work" },
  { name: "Instagram", percentage: 31, category: "social" },
  { name: "Number 26", percentage: 0, category: "financial" },
  { name: "Whatsapp", percentage: 15, category: "social" },
  { name: "Twitter", percentage: 13, category: "social" },
  { name: "Google Maps", percentage: 24, category: "utility" },
  { name: "Spotify", percentage: 21, category: "entertainment" },
  { name: "Uber", percentage: 0, category: "transportation" },
  { name: "Drive Now", percentage: 9, category: "transportation" },
  { name: "New York Times", percentage: 27, category: "news" },
  { name: "Skype", percentage: 18, category: "work" }
];

const CATEGORIES = {
  work: "Work",
  social: "Social",
  financial: "Financial",
  entertainment: "Entertainment",
  utility: "Utility",
  transportation: "Transportation",
  news: "News"
};

const SUGGESTIONS = [
  "Make the cards bigger",
  "Create a more compact layout",
  "Show work apps only",
  "Show entertainment apps",
  "Display financial apps",
  "Show social media apps",
  "Optimize for widescreen display",
  "Increase spacing between cards",
  "Make the grid more square-shaped",
  "Arrange in a 3x4 grid"
];

type CategoryKey = keyof typeof CATEGORIES;

export function DashboardWrapper() {
  const location = useLocation();
  const [config, setConfig] = useState<DashboardConfig>(() => {
    // Try to load saved config on initial render
    const savedConfig = getLatestConfig();
    if (savedConfig) {
      return savedConfig;
    }
    // Fall back to default config if no saved config exists
    return {
      cols: 5,
      rows: 10,
      rowHeight: 60,
      margin: [6, 6],
      layouts: DEFAULT_APPS.map((app, i) => ({
        i: app.name,
        x: i % 5,
        y: Math.floor(i / 5),
        w: 1,
        h: 1,
        maxW: 5,
        maxH: 10,
        minW: 1,
        minH: 1,
      })),
      apps: DEFAULT_APPS
    };
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(() => {
    // Try to determine initial category from saved config
    const savedConfig = getLatestConfig();
    if (savedConfig) {
      return savedConfig.activeCategory as CategoryKey | null;
    }
    return null;
  });
  const [showCategories, setShowCategories] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Load saved config when returning to the dashboard
  useEffect(() => {
    if (location.pathname === '/') {
      const savedConfig = activeCategory ? getConfigByCategory(activeCategory) : getLatestConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        // Ensure active category is in sync with saved config
        if (savedConfig.activeCategory !== activeCategory) {
          setActiveCategory(savedConfig.activeCategory as CategoryKey | null);
        }
      }
    }
  }, [location.pathname, activeCategory]);

  const filterAppsByCategory = (category: string | null) => {
    setActiveCategory(category as CategoryKey | null);
    const filteredApps = category 
      ? DEFAULT_APPS.filter(app => app.category === category)
      : DEFAULT_APPS;

    // Calculate optimal grid dimensions based on number of apps
    const numApps = filteredApps.length;
    let newCols: number;
    let newRows: number;
    
    if (category === null) {
      // Default layout for all apps
      newCols = 5;
      newRows = 10;
    } else {
      // Calculate optimal dimensions for filtered apps
      if (numApps <= 3) {
        newCols = numApps;
        newRows = 1;
      } else if (numApps <= 6) {
        newCols = 3;
        newRows = Math.ceil(numApps / 3);
      } else {
        newCols = 4;
        newRows = Math.ceil(numApps / 4);
      }
    }

    // Adjust row height to fill available space better
    const containerHeight = window.innerHeight - 200; // Account for padding and input bar
    const newRowHeight = Math.min(200, Math.floor(containerHeight / newRows));

    const newLayouts = filteredApps.map((app, i) => ({
      i: app.name,
      x: i % newCols,
      y: Math.floor(i / newCols),
      w: 1,
      h: 1,
      maxW: newCols,
      maxH: newRows,
      minW: 1,
      minH: 1,
    }));

    const newConfig = {
      ...config,
      cols: newCols,
      rows: newRows,
      rowHeight: newRowHeight,
      layouts: newLayouts,
      apps: filteredApps
    };

    console.log('Filtering by category:', category);
    console.log('Filtered apps:', filteredApps);
    console.log('New config:', newConfig);

    setConfig(newConfig);
    // Save the new configuration with the category
    saveConfig(newConfig, category);
  };

  const handleSubmit = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    // Check if the input contains category-related keywords
    const categoryKeywords = {
      work: ["work", "business", "professional"],
      social: ["social", "social media"],
      financial: ["financial", "finance", "money"],
      entertainment: ["entertainment", "fun", "media"],
      utility: ["utility", "tools"],
      transportation: ["transportation", "travel"],
      news: ["news", "current events"]
    };

    let foundCategory = false;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        console.log('Found category match:', category);
        filterAppsByCategory(category);
        setInput('');
        setShowSuggestions(false);
        foundCategory = true;
        break;
      }
    }

    if (!foundCategory) {
      setIsLoading(true);
      try {
        const newConfig = await updateDashboardConfig(text, config);
        console.log('New config from AI:', newConfig);
        // Preserve the current apps and layouts when updating via AI
        const updatedConfig = {
          ...newConfig,
          apps: config.apps,
          layouts: (config.layouts || []).map(layout => ({
            ...layout,
            maxW: newConfig.cols,
            maxH: newConfig.rows
          }))
        };
        setConfig(updatedConfig);
        // Save the new configuration
        saveConfig(updatedConfig, activeCategory);
        setInput('');
        setShowSuggestions(false);
      } catch (error) {
        console.error('Error updating config:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black pb-28">
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <AppDashboard defaultConfig={config} hideControls={true} />
      </div>
      
      {isLoading && (
        <div className="fixed top-4 right-4 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-full animate-pulse">
          Updating layout...
        </div>
      )}
      
      <div className="fixed bottom-16 left-0 right-0 bg-zinc-900 p-4">
        <div className="max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 flex gap-2">
              <IconBulb
                size={20}
                className="cursor-pointer hover:text-zinc-300 transition-colors"
                onClick={() => {
                  setShowSuggestions(!showSuggestions);
                  setShowCategories(false);
                  setShowConfig(false);
                }}
              />
              <IconFilter
                size={20}
                className={`cursor-pointer transition-colors ${
                  activeCategory ? 'text-zinc-100' : 'hover:text-zinc-300'
                }`}
                onClick={() => {
                  setShowCategories(!showCategories);
                  setShowSuggestions(false);
                  setShowConfig(false);
                }}
              />
              <IconSettings
                size={20}
                className={`cursor-pointer transition-colors ${
                  showConfig ? 'text-zinc-100' : 'hover:text-zinc-300'
                }`}
                onClick={() => {
                  setShowConfig(!showConfig);
                  setShowSuggestions(false);
                  setShowCategories(false);
                }}
              />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe how to update the dashboard..."
              className="flex-1 w-full pl-24 p-2 bg-zinc-800 text-zinc-300 rounded"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              onFocus={() => setShowSuggestions(true)}
              disabled={isLoading}
            />
            {showSuggestions && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-800 rounded shadow-lg max-h-60 overflow-y-auto">
                {SUGGESTIONS.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-zinc-700 cursor-pointer text-zinc-300 text-sm"
                    onClick={() => handleSubmit(suggestion)}
                  >
                    {suggestion}
                  </div>
                )).reverse()}
              </div>
            )}
            {showCategories && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-800 rounded shadow-lg overflow-hidden">
                <div
                  className={`px-3 py-2 hover:bg-zinc-700 cursor-pointer text-zinc-300 text-sm ${
                    activeCategory === null ? 'bg-zinc-700' : ''
                  }`}
                  onClick={() => {
                    filterAppsByCategory(null);
                    setShowCategories(false);
                  }}
                >
                  All Apps
                </div>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <div
                    key={key}
                    className={`px-3 py-2 hover:bg-zinc-700 cursor-pointer text-zinc-300 text-sm ${
                      activeCategory === key ? 'bg-zinc-700' : ''
                    }`}
                    onClick={() => {
                      filterAppsByCategory(key);
                      setShowCategories(false);
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
            {showConfig && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-800 rounded shadow-lg overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-zinc-300">Current Configuration</h3>
                    <div className="space-y-1 text-xs text-zinc-400">
                      <p>Columns: {config.cols}</p>
                      <p>Rows: {config.rows}</p>
                      <p>Row Height: {config.rowHeight}px</p>
                      <p>Margin: [{config.margin.join(', ')}]</p>
                      <p>Total Apps: {config.apps.length}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-zinc-300">Active Category</h3>
                    <p className="text-xs text-zinc-400">
                      {activeCategory ? CATEGORIES[activeCategory] : 'All Apps'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-zinc-300">App Distribution</h3>
                    <div className="space-y-1 text-xs text-zinc-400">
                      {Object.entries(CATEGORIES).map(([key, label]) => (
                        <p key={key}>
                          {label}: {DEFAULT_APPS.filter(app => app.category === key).length} apps
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className={`px-4 py-2 bg-zinc-800 text-zinc-300 rounded transition-colors whitespace-nowrap
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-xl mx-auto flex justify-center space-x-8 p-4">
          <Link to="/" className="text-sm text-zinc-300">Home</Link>
          <Link to="/context" className="text-sm text-zinc-500">Context</Link>
        </div>
      </div>
    </div>
  );
} 