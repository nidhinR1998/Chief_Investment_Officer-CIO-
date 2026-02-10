// API functions for market data
const API_BASE = 'http://localhost:8000';

export const getMarketData = async (category) => {
    const response = await fetch(`${API_BASE}/api/v1/market/${category}`);
    if (!response.ok) throw new Error(`Failed to fetch ${category} data`);
    return response.json();
};

export const getMarketSummary = async () => {
    const response = await fetch(`${API_BASE}/api/v1/market/summary`);
    if (!response.ok) throw new Error('Failed to fetch market summary');
    return response.json();
};
