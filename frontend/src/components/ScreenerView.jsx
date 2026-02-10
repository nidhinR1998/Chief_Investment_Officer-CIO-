import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Filter, X } from 'lucide-react';
import axios from 'axios';

const ScreenerView = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        min_market_cap: '',
        max_market_cap: '',
        min_pe: '',
        max_pe: '',
        min_price: '',
        max_price: '',
        sector: ''
    });
    const [sectors, setSectors] = useState([]);

    useEffect(() => {
        fetchSectors();
        fetchStocks();
    }, []);

    const fetchSectors = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/screener/sectors');
            setSectors(res.data.sectors);
        } catch (err) {
            console.error('Failed to fetch sectors:', err);
        }
    };

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const res = await axios.get(`http://localhost:8000/api/v1/screener/stocks?${params}`);
            setStocks(res.data.stocks);
        } catch (err) {
            console.error('Screener error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            min_market_cap: '',
            max_market_cap: '',
            min_pe: '',
            max_pe: '',
            min_price: '',
            max_price: '',
            sector: ''
        });
    };

    const handleApplyFilters = () => {
        fetchStocks();
    };

    return (
        <div className="w-full min-h-full bg-[#f6f6f6]">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
                {/* Page Header */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Stock Screener</h1>
                    <p className="text-gray-600">Filter and discover stocks based on your criteria</p>
                </div>

                {/* Filter Panel */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Filter size={20} />
                            Filters
                        </h2>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-600 hover:text-[#7e1fff] flex items-center gap-1"
                        >
                            <X size={16} />
                            Clear All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Market Cap Range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Min Market Cap (₹B)</label>
                            <input
                                type="number"
                                value={filters.min_market_cap}
                                onChange={(e) => handleFilterChange('min_market_cap', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Max Market Cap (₹B)</label>
                            <input
                                type="number"
                                value={filters.max_market_cap}
                                onChange={(e) => handleFilterChange('max_market_cap', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                placeholder="e.g., 10000"
                            />
                        </div>

                        {/* P/E Ratio Range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Min P/E Ratio</label>
                            <input
                                type="number"
                                value={filters.min_pe}
                                onChange={(e) => handleFilterChange('min_pe', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                placeholder="e.g., 10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Max P/E Ratio</label>
                            <input
                                type="number"
                                value={filters.max_pe}
                                onChange={(e) => handleFilterChange('max_pe', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                placeholder="e.g., 50"
                            />
                        </div>

                        {/* Price Range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Min Price (₹)</label>
                            <input
                                type="number"
                                value={filters.min_price}
                                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                placeholder="e.g., 100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Max Price (₹)</label>
                            <input
                                type="number"
                                value={filters.max_price}
                                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                placeholder="e.g., 5000"
                            />
                        </div>

                        {/* Sector */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sector</label>
                            <select
                                value={filters.sector}
                                onChange={(e) => handleFilterChange('sector', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            >
                                <option value="">All Sectors</option>
                                {sectors.map(sector => (
                                    <option key={sector} value={sector}>{sector}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleApplyFilters}
                        className="w-full md:w-auto px-6 py-2 bg-[#7e1fff] hover:bg-[#6a1ad9] text-white rounded font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Search size={18} />
                        Apply Filters
                    </button>
                </div>

                {/* Results */}
                <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Results {stocks.length > 0 && `(${stocks.length})`}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : stocks.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-lg">No stocks match your criteria. Try adjusting the filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-slate-700">Symbol</th>
                                        <th className="text-left p-4 font-semibold text-slate-700">Company</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Price (₹)</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Change</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Market Cap (₹B)</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">P/E Ratio</th>
                                        <th className="text-left p-4 font-semibold text-slate-700">Sector</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Volume</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stocks.map((stock, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-bold text-[#7e1fff]">{stock.ticker}</td>
                                            <td className="p-4 text-slate-900">{stock.name}</td>
                                            <td className="p-4 text-right font-semibold text-slate-900">
                                                ₹{stock.price.toFixed(2)}
                                            </td>
                                            <td className={`p-4 text-right font-semibold ${stock.changePct >= 0 ? 'text-[#00b652]' : 'text-[#ff333a]'}`}>
                                                <div className="flex items-center justify-end gap-1">
                                                    {stock.changePct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                    {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-slate-900">
                                                {stock.marketCap.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right text-slate-900">
                                                {stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A'}
                                            </td>
                                            <td className="p-4 text-slate-700">{stock.sector}</td>
                                            <td className="p-4 text-right text-slate-700">
                                                {(stock.volume / 1000000).toFixed(2)}M
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScreenerView;
