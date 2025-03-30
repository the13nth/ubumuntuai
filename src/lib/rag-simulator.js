import responseTemplates from './rag-response-templates.json';

/**
 * RAG Query Simulator
 * 
 * This module simulates the behavior of the Retrieval Augmented Generation system
 * by processing queries and returning appropriate simulated responses.
 */

/**
 * Process a query and return a simulated RAG response
 * 
 * @param {string} query - The user's query text
 * @param {object} dashboardContext - The current dashboard configuration
 * @returns {object} - A simulated RAG response
 */
export function processQuery(query, dashboardContext) {
  console.log('Processing query:', query);
  console.log('Current dashboard context:', dashboardContext);
  
  // Normalize query for matching
  const normalizedQuery = query.toLowerCase().trim();
  
  // Try to match the query to a category
  const categoryMatch = matchCategoryQuery(normalizedQuery);
  if (categoryMatch) {
    console.log('Matched to category query:', categoryMatch);
    return simulateResponse(responseTemplates.categoryQueries[categoryMatch], dashboardContext);
  }
  
  // Try to match the query to a layout modification
  const layoutMatch = matchLayoutQuery(normalizedQuery);
  if (layoutMatch) {
    console.log('Matched to layout query:', layoutMatch);
    return simulateResponse(responseTemplates.layoutQueries[layoutMatch], dashboardContext);
  }
  
  // If we couldn't match to a known query type, return a parsing error
  console.log('No match found, returning parsing error');
  return simulateErrorResponse('parsingError', dashboardContext);
}

/**
 * Attempt to match a query to a category filter action
 * 
 * @param {string} query - The normalized query
 * @returns {string|null} - The matched category key or null
 */
function matchCategoryQuery(query) {
  const categoryKeywords = {
    work: ['work', 'business', 'professional'],
    social: ['social', 'social media'],
    financial: ['financial', 'finance', 'money'],
    entertainment: ['entertainment', 'fun', 'media'],
    utility: ['utility', 'tools'],
    transportation: ['transportation', 'travel'],
    news: ['news', 'current events'],
    all: ['all apps', 'show all', 'display all']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return category;
    }
  }
  
  return null;
}

/**
 * Attempt to match a query to a layout modification action
 * 
 * @param {string} query - The normalized query
 * @returns {string|null} - The matched layout action key or null
 */
function matchLayoutQuery(query) {
  const layoutKeywords = {
    bigger: ['bigger', 'larger', 'increase size'],
    compact: ['compact', 'smaller', 'decrease size', 'tighter'],
    widescreen: ['widescreen', 'wide screen', 'landscape', 'horizontal'],
    spacing: ['spacing', 'space', 'gap', 'margin'],
    square: ['square', 'even', 'balanced'],
    specificGrid: ['3x4', '4x3', 'grid', 'arrange']
  };
  
  for (const [action, keywords] of Object.entries(layoutKeywords)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return action;
    }
  }
  
  return null;
}

/**
 * Generate a simulated response based on a template and the current context
 * 
 * @param {object} template - The response template
 * @param {object} dashboardContext - The current dashboard configuration
 * @returns {object} - A customized response
 */
function simulateResponse(template, dashboardContext) {
  // Create a copy of the template response
  const response = JSON.parse(JSON.stringify(template.response));
  
  // Generate random embedding coordinates if they don't exist
  if (!response.query_embedding_visualization) {
    response.query_embedding_visualization = {
      x: Math.random(),
      y: Math.random(),
      z: Math.random()
    };
  }
  
  // Add processing timestamp if it doesn't exist
  if (!response.timestamp) {
    response.timestamp = new Date().toISOString();
  }
  
  // If there's a dashboardConfig in the template and we're not overriding with provided context
  if (response.dashboardConfig) {
    // We already have a dashboardConfig in the template
    console.log('Using template dashboardConfig');
  } else {
    // No dashboardConfig in the template, so create one from the provided context
    console.log('Creating dashboardConfig from context');
    response.dashboardConfig = {
      ...dashboardContext,
      timestamp: new Date().toISOString()
    };
  }
  
  // Add the provided dashboard context for reference
  response.contextProvided = dashboardContext;
  
  return response;
}

/**
 * Generate a simulated error response
 * 
 * @param {string} errorType - The type of error from the templates
 * @param {object} dashboardContext - The current dashboard configuration
 * @returns {object} - An error response
 */
function simulateErrorResponse(errorType, dashboardContext) {
  const errorTemplate = responseTemplates.errorResponses[errorType] ||
                       responseTemplates.errorResponses.parsingError;
  
  // Create a copy of the template response
  const response = JSON.parse(JSON.stringify(errorTemplate.response));
  
  // Add processing timestamp
  response.timestamp = new Date().toISOString();
  
  // Add dashboard context that was provided
  response.contextProvided = dashboardContext;
  
  return response;
}

/**
 * Process a specific example query from the documentation
 * 
 * @param {string} exampleName - The name of the example query to process
 * @returns {object} - The response for the example query
 */
export function processExampleQuery(exampleName) {
  const categoryExamples = Object.keys(responseTemplates.categoryQueries);
  const layoutExamples = Object.keys(responseTemplates.layoutQueries);
  const errorExamples = Object.keys(responseTemplates.errorResponses);
  
  let template;
  let sampleContext;
  
  if (categoryExamples.includes(exampleName)) {
    template = responseTemplates.categoryQueries[exampleName];
    sampleContext = {
      activeCategory: "financial",
      cols: 1,
      margin: [5, 5],
      numApps: 1,
      rowHeight: 200,
      rows: 1
    };
  } else if (layoutExamples.includes(exampleName)) {
    template = responseTemplates.layoutQueries[exampleName];
    sampleContext = {
      activeCategory: "social",
      cols: 3,
      margin: [6, 6],
      numApps: 4,
      rowHeight: 150,
      rows: 2
    };
  } else if (errorExamples.includes(exampleName)) {
    template = responseTemplates.errorResponses[exampleName];
    sampleContext = {
      activeCategory: null,
      cols: 5,
      margin: [6, 6],
      numApps: 12,
      rowHeight: 60,
      rows: 10
    };
  } else {
    return {
      error: `Example "${exampleName}" not found`
    };
  }
  
  return simulateResponse(template, sampleContext);
}

/**
 * Generate a full example with input, output, and explanation
 * 
 * @param {string} exampleName - The name of the example query to process
 * @returns {object} - The full example details
 */
export function getDetailedExample(exampleName) {
  const categoryExamples = Object.keys(responseTemplates.categoryQueries);
  const layoutExamples = Object.keys(responseTemplates.layoutQueries);
  const errorExamples = Object.keys(responseTemplates.errorResponses);
  
  let template;
  let sampleContext;
  let collection;
  
  if (categoryExamples.includes(exampleName)) {
    template = responseTemplates.categoryQueries[exampleName];
    collection = "categoryQueries";
    sampleContext = {
      activeCategory: "financial",
      cols: 1,
      margin: [5, 5],
      numApps: 1,
      rowHeight: 200,
      rows: 1
    };
  } else if (layoutExamples.includes(exampleName)) {
    template = responseTemplates.layoutQueries[exampleName];
    collection = "layoutQueries";
    sampleContext = {
      activeCategory: "social",
      cols: 3,
      margin: [6, 6],
      numApps: 4,
      rowHeight: 150,
      rows: 2
    };
  } else if (errorExamples.includes(exampleName)) {
    template = responseTemplates.errorResponses[exampleName];
    collection = "errorResponses";
    sampleContext = {
      activeCategory: null,
      cols: 5,
      margin: [6, 6],
      numApps: 12,
      rowHeight: 60,
      rows: 10
    };
  } else {
    return {
      error: `Example "${exampleName}" not found`
    };
  }
  
  const response = simulateResponse(template, sampleContext);
  
  return {
    type: collection,
    name: exampleName,
    input: {
      query: template.query,
      timestamp: new Date().toISOString(),
      source: "dashboard",
      status: "Not Processed",
      dashboardContext: sampleContext
    },
    output: response,
    systemActions: template.systemActions || []
  };
} 