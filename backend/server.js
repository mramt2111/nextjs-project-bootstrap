import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import axios from 'axios';

dotenv.config();

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

app.use(cors());
app.use(express.json());

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ message: 'Stock Market Dashboard Backend is running' });
});

// API route to search stocks using Twelve Data API
app.get('/api/search', async (req, res) => {
  const query = req.query.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const cacheKey = `search_${query}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.twelvedata.com/symbol_search', {
      params: {
        symbol: query,
        apikey: process.env.TWELVE_DATA_API_KEY,
      },
    });

    const results = response.data.data || [];
    cache.set(cacheKey, results);
    res.json(results);
  } catch (error) {
    console.error('Error fetching stock search:', error);
    res.status(500).json({ error: 'Failed to fetch stock search' });
  }
});

const PORT = process.env.PORT || 5000;
app.get('/api/top-performers', async (req, res) => {
  const cacheKey = 'top_performers';
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    // Using Twelve Data API to get top gainers (example endpoint)
    // Note: Twelve Data does not have a direct top gainers endpoint,
    // so this is a placeholder for demonstration.
    // You may need to use another API or implement logic to get top gainers.

    // For demonstration, fetch a list of symbols and filter top gainers
    const symbolsResponse = await axios.get('https://api.twelvedata.com/stocks', {
      params: {
        apikey: process.env.TWELVE_DATA_API_KEY,
      },
    });

    const symbols = symbolsResponse.data.data || [];

    // For simplicity, return first 10 symbols as top performers
    const topPerformers = symbols.slice(0, 10).map((s) => ({
      symbol: s.symbol,
      name: s.name,
      changePercent: 0, // Placeholder, real change percent should be fetched
    }));

    cache.set(cacheKey, topPerformers);
    res.json(topPerformers);
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

// API route to get live stock quote
app.get('/api/quote', async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `quote_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.twelvedata.com/quote', {
      params: {
        symbol: symbol,
        apikey: process.env.TWELVE_DATA_API_KEY,
      },
    });

    const quote = response.data;
    cache.set(cacheKey, quote);
    res.json(quote);
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

// API route to get company info
app.get('/api/company-info', async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `company_info_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    // Twelve Data does not provide detailed company info in free tier,
    // so this is a placeholder for demonstration.
    // You may need to use another API like Finnhub or Financial Modeling Prep.

    // For demonstration, return mock data
    const companyInfo = {
      symbol: symbol,
      sector: "Technology",
      marketCap: "1.5T",
      peRatio: 30.5,
      dividendYield: 1.2,
    };

    cache.set(cacheKey, companyInfo);
    res.json(companyInfo);
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({ error: 'Failed to fetch company info' });
  }
});

// API route to get historical data
app.get('/api/historical-data', async (req, res) => {
  const symbol = req.query.symbol;
  const interval = req.query.interval || '1day'; // default to daily
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `historical_data_${symbol}_${interval}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol: symbol,
        interval: interval,
        apikey: process.env.TWELVE_DATA_API_KEY,
        format: 'JSON',
        outputsize: 30, // last 30 data points
      },
    });

    const data = response.data;
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
