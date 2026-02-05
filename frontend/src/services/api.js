import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getStockAnalysis = async (ticker, context = {}) => {
    try {
        const response = await api.get(`/stocks/${ticker}`, {
            params: {
                user_price: context.price || 0,
                user_quantity: context.quantity || 0
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching analysis for ${ticker}:`, error);
        throw error;
    }
};

export const startMonitoring = async (ticker) => {
    return await api.post(`/stocks/${ticker}/start`);
};

export const stopMonitoring = async (ticker) => {
    return await api.post(`/stocks/${ticker}/stop`);
};

export const parseSearchQuery = async (query) => {
    try {
        console.log("API: Sending Search Query:", query);
        const response = await api.post('/stocks/parse', { query });
        console.log("API: Search Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("NLP Parse Error", error);
        return { valid: false };
    }
};

export const getPortfolio = async () => {
    const res = await api.get('/portfolio/');
    return res.data;
};

export const executeTrade = async (tradeData) => {
    // tradeData: { ticker, action, quantity, price }
    const res = await api.post('/portfolio/trade', tradeData);
    return res.data;
};

export default api;
