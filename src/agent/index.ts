import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export interface DashboardConfig {
  cols: number;
  rows: number;
  rowHeight: number;
  margin: [number, number];
  layouts?: any[];
  apps: any[];
}

export async function updateDashboardConfig(userInput: string, currentConfig: DashboardConfig): Promise<DashboardConfig> {
  try {
    console.log('Current config:', currentConfig);
    console.log('User input:', userInput);

    const prompt = `You are a UI layout assistant. Given this dashboard configuration:
      - Current columns: ${currentConfig.cols}
      - Current rows: ${currentConfig.rows}
      - Current row height: ${currentConfig.rowHeight}px
      - Current margin: ${JSON.stringify(currentConfig.margin)}

      User request: "${userInput}"

      Based on the user's request, return ONLY a JSON object with updated values that will improve the layout.
      The response must be a valid JSON object with these properties:
      {
        "cols": (number between 1-12),
        "rows": (number between 1-20),
        "rowHeight": (number between 40-200),
        "margin": [number, number]
      }

      Example response:
      {
        "cols": 6,
        "rows": 8,
        "rowHeight": 80,
        "margin": [6, 6]
      }

      Make meaningful changes based on the request - don't return the same values unless the request specifically asks to keep them.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw model response:', text);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    
    const newConfig = JSON.parse(jsonMatch[0]);
    console.log('Parsed new config:', newConfig);

    // Validate required properties
    if (!newConfig.cols || !newConfig.rows || !newConfig.rowHeight || !newConfig.margin) {
      throw new Error("Missing required properties in response");
    }

    // Ensure values are within bounds
    const cols = Math.min(Math.max(1, newConfig.cols), 12);
    const rows = Math.min(Math.max(1, newConfig.rows), 20);
    const rowHeight = Math.min(Math.max(40, newConfig.rowHeight), 200);
    const margin = [
      Math.min(Math.max(0, newConfig.margin[0]), 20),
      Math.min(Math.max(0, newConfig.margin[1] ?? newConfig.margin[0]), 20)
    ] as [number, number];

    // Generate new layouts based on the new grid dimensions
    const newLayouts = currentConfig.apps.map((app, i) => ({
      i: app.name,
      x: i % cols,
      y: Math.floor(i / cols),
      w: 1,
      h: 1,
      maxW: cols,
      maxH: rows,
      minW: 1,
      minH: 1,
    }));

    const updatedConfig = {
      ...currentConfig,
      cols,
      rows,
      rowHeight,
      margin,
      layouts: newLayouts
    };

    console.log('Final updated config:', updatedConfig);
    return updatedConfig;
  } catch (error) {
    console.error("Error updating dashboard config:", error);
    return currentConfig; // Return current config if there's an error
  }
} 