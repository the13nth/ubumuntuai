import type { DashboardConfig } from '../agent';

const STORAGE_KEY = 'dashboard_config';
const CATEGORY_PREFIX = 'dashboard_config_category_';

interface StoredConfig extends DashboardConfig {
  activeCategory: string | null;
  created_at: string;
}

export function saveConfig(config: DashboardConfig, category: string | null = null): void {
  const key = category ? `${CATEGORY_PREFIX}${category}` : STORAGE_KEY;
  const storedConfig: StoredConfig = {
    ...config,
    activeCategory: category,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(storedConfig));
  // Also update the latest config
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConfig));
}

export function getLatestConfig(): (DashboardConfig & { activeCategory: string | null }) | null {
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
      activeCategory: parsed.activeCategory
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