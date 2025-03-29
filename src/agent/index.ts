import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    const prompt = `
      Given the current dashboard configuration:
      - Columns: ${currentConfig.cols}
      - Rows: ${currentConfig.rows}

      User request: "${userInput}"

      Respond with a JSON object containing the updated configuration with these exact properties:
      {
        "cols": number (1-12),
        "rows": number (1-20),
        "rowHeight": ${currentConfig.rowHeight},
        "margin": ${JSON.stringify(currentConfig.margin)},
        "layouts": []
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    
    const newConfig = JSON.parse(jsonMatch[0]);
    return {
      ...newConfig,
      apps: currentConfig.apps // Preserve existing apps
    };
  } catch (error) {
    console.error("Error updating dashboard config:", error);
    return currentConfig; // Return current config if there's an error
  }
} 