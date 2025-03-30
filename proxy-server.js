import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for the RAG API
app.post('/api/proxy/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query cannot be empty',
        answer: 'Error: Query cannot be empty',
        query_embedding_visualization: { x: 0, y: 0, z: 0 }
      });
    }
    
    console.log(`Proxying query to RAG API: "${query}"`);
    
    const RAG_API_ENDPOINT = 'http://localhost:5000/api/external/query';
    const API_KEY = process.env.RAG_API_KEY || '1232123234';
    
    try {
      const response = await fetch(RAG_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`API response status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('RAG API response received successfully');
      
      // Ensure response has the expected format
      return res.json({
        success: true,
        answer: data.answer || `Processed query: "${query}"`,
        query_embedding_visualization: data.query_embedding_visualization || {
          x: Math.random(),
          y: Math.random(),
          z: Math.random()
        },
        ...data
      });
    } catch (error) {
      console.error(`Error contacting RAG API: ${error.message}`);
      
      // Generate a mock response when the actual API is unavailable
      return res.json({
        success: true,
        answer: `This is a simulated response for: "${query}" (The actual RAG API is unavailable)`,
        query_embedding_visualization: {
          x: Math.random(),
          y: Math.random(),
          z: Math.random()
        },
        mock: true
      });
    }
  } catch (error) {
    console.error('Error in proxy server:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      answer: `Server error: ${error.message}`,
      query_embedding_visualization: { x: 0, y: 0, z: 0 }
    });
  }
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`Use /api/proxy/query to forward requests to the RAG API`);
}); 