import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const MarketDataView = ({ category, onBack }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        loadMarketData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadMarketData, 30000);
        return () => clearInterval(interval);
    }, [category]);

    const loadMarketData = async () => {
        console.log(`[MarketDataView] Loading data for category: ${category}`);
        setLoading(true);
        setError(null);

        try {
            const url = `${API_BASE}/api/v1/market/${category}`;
            console.log(`[MarketDataView] Fetching from: ${url}`);
            const response = await fetch(url);
            console.log(`[MarketDataView] Response status: ${response.status}`);
            if (!response.ok) throw new Error(`Failed to fetch ${category} data`);

            const result = await response.json();
            console.log(`[MarketDataView] Received data:`, result);
            console.log(`[MarketDataView] Data array length: ${result.data?.length || 0}`);
            setData(result.data || []);
            setLastUpdated(new Date(result.lastUpdated).toLocaleTimeString());
            if (initialLoad) setInitialLoad(false);
        } catch (err) {
            console.error('[MarketDataView] Error loading market data:', err);
            setError(err.message);
            // Fallback to mock data if API fails
            const mockData = getMockData(category);
            console.log(`[MarketDataView] Using mock data:`, mockData);
            setData(mockData);
            setLastUpdated(new Date().toLocaleTimeString());
            if (initialLoad) setInitialLoad(false);
        } finally {
            setLoading(false);
        }
    };

    // Log when data actually updates
    useEffect(() => {
        console.log(`[MarketDataView] Data state updated. Current count: ${data.length}`, data);
    }, [data]);

    const getMockData = (cat) => {
        switch (cat) {
            case 'currencies':
                return [
                    { symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', price: '83.12', change: '+0.15', pct: '+0.18%', isUp: true, volume: '45.2B' },
                    { symbol: 'EUR/INR', name: 'Euro / Indian Rupee', price: '90.45', change: '+0.22', pct: '+0.24%', isUp: true, volume: '21.3B' },
                    { symbol: 'GBP/INR', name: 'British Pound / Indian Rupee', price: '105.67', change: '-0.18', pct: '-0.17%', isUp: false, volume: '12.8B' },
                    { symbol: 'JPY/INR', name: 'Japanese Yen / Indian Rupee', price: '0.56', change: '+0.01', pct: '+1.82%', isUp: true, volume: '8.4B' },
                    { symbol: 'AUD/INR', name: 'Australian Dollar / Indian Rupee', price: '54.32', change: '-0.12', pct: '-0.22%', isUp: false, volume: '5.6B' },
                    { symbol: 'CAD/INR', name: 'Canadian Dollar / Indian Rupee', price: '61.45', change: '+0.08', pct: '+0.13%', isUp: true, volume: '4.2B' },
                    { symbol: 'CHF/INR', name: 'Swiss Franc / Indian Rupee', price: '94.28', change: '+0.15', pct: '+0.16%', isUp: true, volume: '3.8B' },
                    { symbol: 'CNY/INR', name: 'Chinese Yuan / Indian Rupee', price: '11.68', change: '-0.05', pct: '-0.43%', isUp: false, volume: '15.2B' },
                ];
            case 'futures':
                return [
                    { symbol: 'NIFTY FUT', name: 'Nifty 50 Futures', price: '24,385.50', change: '+142.30', pct: '+0.59%', isUp: true, volume: '125.4M', expiry: 'Feb 29, 2024' },
                    { symbol: 'BANKNIFTY FUT', name: 'Bank Nifty Futures', price: '52,450.20', change: '-38.50', pct: '-0.07%', isUp: false, volume: '89.2M', expiry: 'Feb 29, 2024' },
                    { symbol: 'RELIANCE FUT', name: 'Reliance Industries Futures', price: '2,985.40', change: '+18.20', pct: '+0.61%', isUp: true, volume: '45.6M', expiry: 'Feb 29, 2024' },
                    { symbol: 'TCS FUT', name: 'TCS Futures', price: '3,845.60', change: '+25.80', pct: '+0.67%', isUp: true, volume: '12.3M', expiry: 'Feb 29, 2024' },
                    { symbol: 'INFY FUT', name: 'Infosys Futures', price: '1,655.30', change: '+12.50', pct: '+0.76%', isUp: true, volume: '18.9M', expiry: 'Feb 29, 2024' },
                    { symbol: 'HDFC FUT', name: 'HDFC Bank Futures', price: '1,452.80', change: '-8.40', pct: '-0.57%', isUp: false, volume: '34.5M', expiry: 'Feb 29, 2024' },
                    { symbol: 'CRUDE OIL', name: 'Crude Oil Futures', price: '$72.45', change: '+0.85', pct: '+1.19%', isUp: true, volume: '245.6K', expiry: 'Mar 20, 2024' },
                    { symbol: 'GOLD', name: 'Gold Futures', price: '₹62,450', change: '-125.00', pct: '-0.20%', isUp: false, volume: '56.8K', expiry: 'Apr 5, 2024' },
                ];
            case 'options':
                return [
                    { symbol: 'NIFTY 24400 CE', name: 'Nifty 24400 Call', price: '185.50', change: '+45.20', pct: '+32.22%', isUp: true, volume: '8.5M', oi: '12.3M', expiry: 'Feb 8, 2024' },
                    { symbol: 'NIFTY 24400 PE', name: 'Nifty 24400 Put', price: '42.30', change: '-18.50', pct: '-30.42%', isUp: false, volume: '6.2M', oi: '9.8M', expiry: 'Feb 8, 2024' },
                    { symbol: 'NIFTY 24500 CE', name: 'Nifty 24500 Call', price: '98.40', change: '+22.10', pct: '+28.96%', isUp: true, volume: '15.4M', oi: '18.9M', expiry: 'Feb 8, 2024' },
                    { symbol: 'NIFTY 24500 PE', name: 'Nifty 24500 Put', price: '125.80', change: '-8.20', pct: '-6.12%', isUp: false, volume: '12.1M', oi: '15.6M', expiry: 'Feb 8, 2024' },
                    { symbol: 'BANKNIFTY 52500 CE', name: 'Bank Nifty 52500 Call', price: '245.60', change: '+35.40', pct: '+16.85%', isUp: true, volume: '4.5M', oi: '6.7M', expiry: 'Feb 7, 2024' },
                    { symbol: 'BANKNIFTY 52500 PE', name: 'Bank Nifty 52500 Put', price: '189.30', change: '-12.60', pct: '-6.24%', isUp: false, volume: '3.8M', oi: '5.2M', expiry: 'Feb 7, 2024' },
                    { symbol: 'RELIANCE 3000 CE', name: 'Reliance 3000 Call', price: '45.80', change: '+8.20', pct: '+21.81%', isUp: true, volume: '2.1M', oi: '3.4M', expiry: 'Feb 29, 2024' },
                    { symbol: 'RELIANCE 3000 PE', name: 'Reliance 3000 Put', price: '82.40', change: '-5.60', pct: '-6.36%', isUp: false, volume: '1.8M', oi: '2.9M', expiry: 'Feb 29, 2024' },
                ];
            case 'commodities':
                return [
                    { symbol: 'GOLD', name: 'Gold Spot', price: '₹62,450', change: '-125.00', pct: '-0.20%', isUp: false, volume: '145.6K', unit: 'per 10g' },
                    { symbol: 'SILVER', name: 'Silver Spot', price: '₹72,850', change: '+450.00', pct: '+0.62%', isUp: true, volume: '89.2K', unit: 'per kg' },
                    { symbol: 'CRUDE OIL', name: 'Crude Oil (Brent)', price: '$72.45', change: '+0.85', pct: '+1.19%', isUp: true, volume: '245.6K', unit: 'per barrel' },
                    { symbol: 'NATURAL GAS', name: 'Natural Gas', price: '$2.645', change: '-0.035', pct: '-1.31%', isUp: false, volume: '156.3K', unit: 'per MMBtu' },
                    { symbol: 'COPPER', name: 'Copper', price: '₹745.20', change: '+8.40', pct: '+1.14%', isUp: true, volume: '67.8K', unit: 'per kg' },
                    { symbol: 'ALUMINIUM', name: 'Aluminium', price: '₹215.80', change: '-2.30', pct: '-1.05%', isUp: false, volume: '45.2K', unit: 'per kg' },
                    { symbol: 'ZINC', name: 'Zinc', price: '₹225.40', change: '+3.60', pct: '+1.62%', isUp: true, volume: '34.5K', unit: 'per kg' },
                    { symbol: 'NICKEL', name: 'Nickel', price: '₹1,654.30', change: '-15.20', pct: '-0.91%', isUp: false, volume: '23.4K', unit: 'per kg' },
                ];
            default:
                return [];
        }
    };

    const getCategoryTitle = () => {
        const titles = {
            currencies: 'Foreign Exchange',
            futures: 'Futures Contracts',
            options: 'Options Chain',
            commodities: 'Commodities'
        };
        return titles[category] || 'Market Data';
    };

    console.log(`[MarketDataView] Render - initialLoad: ${initialLoad}, loading: ${loading}, data.length: ${data.length}`);

    if (initialLoad) {
        console.log('[MarketDataView] Rendering loading spinner (initial load)');
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    console.log('[MarketDataView] Rendering table with data');

    return (
        <div className="w-full min-h-full bg-[#f6f6f6]">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
                {/* Error Alert */}
                {error && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            ⚠️ Could not fetch live data from server. Showing cached data. Error: {error}
                        </p>
                    </div>
                )}

                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-purple-700 hover:text-purple-800 mb-4 font-semibold"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{getCategoryTitle()}</h1>
                            <p className="text-sm text-slate-600 mt-1">Real-time market data • Updates every 30 seconds</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">Last Updated</div>
                            <div className="text-sm font-semibold text-slate-900">
                                {loading ? (
                                    <span className="text-blue-600">Updating...</span>
                                ) : (
                                    lastUpdated || 'Loading...'
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-slate-700">Symbol</th>
                                    <th className="text-left p-4 font-semibold text-slate-700">Name</th>
                                    <th className="text-right p-4 font-semibold text-slate-700">Price</th>
                                    <th className="text-right p-4 font-semibold text-slate-700">Change</th>
                                    <th className="text-right p-4 font-semibold text-slate-700">% Change</th>
                                    <th className="text-right p-4 font-semibold text-slate-700">Volume</th>
                                    {category === 'options' && (
                                        <>
                                            <th className="text-right p-4 font-semibold text-slate-700">OI</th>
                                            <th className="text-right p-4 font-semibold text-slate-700">Expiry</th>
                                        </>
                                    )}
                                    {category === 'futures' && (
                                        <th className="text-right p-4 font-semibold text-slate-700">Expiry</th>
                                    )}
                                    {category === 'commodities' && (
                                        <th className="text-right p-4 font-semibold text-slate-700">Unit</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4 font-semibold text-purple-700">{item.symbol}</td>
                                        <td className="p-4 text-slate-700">{item.name}</td>
                                        <td className="p-4 text-right font-bold text-slate-900">{item.price}</td>
                                        <td className={`p-4 text-right font-semibold ${item.isUp ? 'text-green-600' : 'text-red-600'}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {item.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                {item.change}
                                            </div>
                                        </td>
                                        <td className={`p-4 text-right font-semibold ${item.isUp ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.pct}
                                        </td>
                                        <td className="p-4 text-right text-slate-700">{item.volume}</td>
                                        {category === 'options' && (
                                            <>
                                                <td className="p-4 text-right text-slate-700">{item.oi}</td>
                                                <td className="p-4 text-right text-slate-600 text-sm">{item.expiry}</td>
                                            </>
                                        )}
                                        {category === 'futures' && (
                                            <td className="p-4 text-right text-slate-600 text-sm">{item.expiry}</td>
                                        )}
                                        {category === 'commodities' && (
                                            <td className="p-4 text-right text-slate-600 text-sm">{item.unit}</td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Market Information</h3>
                    <p className="text-sm text-blue-800">
                        {category === 'currencies' && 'Foreign exchange rates update in real-time during market hours. All rates are quoted against Indian Rupee (INR).'}
                        {category === 'futures' && 'Futures contracts are derivatives that obligate the buyer to purchase an asset (or the seller to sell an asset) at a predetermined future date and price.'}
                        {category === 'options' && 'Options give the right, but not the obligation, to buy (Call) or sell (Put) an asset at a specified price on or before a certain date. OI = Open Interest.'}
                        {category === 'commodities' && 'Commodity prices reflect the spot prices for physical goods. Prices may vary based on quality, location, and delivery terms.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarketDataView;
