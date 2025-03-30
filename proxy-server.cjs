const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for RAG queries
app.post('/api/proxy/query', async (req, res) => {
  const query = req.body.query;
  console.log(`Proxying query to RAG API: "${query}"`);
  
  try {
    // Use http://host.docker.internal:5000 if running in Docker
    // Use http://127.0.0.1:5000 instead of localhost to avoid IPv6 issues
    const response = await axios({
      method: 'post',
      url: 'http://127.0.0.1:5000/api/external/query',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '1232123234'
      },
      data: { query },
      // Increase timeout for larger responses
      timeout: 30000
    });
    
    console.log('RAG API response received');
    res.json(response.data);
  } catch (error) {
    console.error('Error contacting RAG API:', error.message);
    res.status(500).json({
      error: `Error contacting RAG API: ${error.message}`,
      details: error.response ? error.response.data : null
    });
  }
});

app.listen(PORT, () => {
  console.log(`CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`Use /api/proxy/query to forward requests to the RAG API`);
}); 