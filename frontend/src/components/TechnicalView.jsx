import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';

const TechnicalView = () => {
    const [ticker, setTicker] = useState('RELIANCE');
    const [timeframe, setTimeframe] = useState('1mo');
    const [chartData, setChartData] = useState([]);
    const [indicators, setIndicators] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchChartData();
        fetchIndicators();
    }, [ticker, timeframe]);

    const fetchChartData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/technical/${ticker}/history?period=${timeframe}`);
            setChartData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch chart data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchIndicators = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/technical/${ticker}/indicators?period=${timeframe}`);
            setIndicators(res.data);
        } catch (err) {
            console.error('Failed to fetch indicators:', err);
        }
    };

    const handleTickerSubmit = (e) => {
        e.preventDefault();
        fetchChartData();
        fetchIndicators();
    };

    return (
        <div className="w-full min-h-full bg-[#f6f6f6]">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
                {/* Page Header */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Technical Analysis</h1>
                    <p className="text-gray-600">Advanced charting with technical indicators</p>
                </div>

                {/* Ticker Selector and Controls */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <form onSubmit={handleTickerSubmit} className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Ticker Symbol</label>
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                className="w-full border border-gray-300 rounded px-3 py-2 font-semibold text-[#7e1fff]"
                                placeholder="e.g., RELIANCE"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Timeframe</label>
                            <div className="flex gap-2">
                                {['1d', '5d', '1mo', '3mo', '6mo', '1y'].map(tf => (
                                    <button
                                        key={tf}
                                        type="button"
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-3 py-2 rounded font-semibold transition-colors ${timeframe === tf
                                            ? 'bg-[#7e1fff] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tf.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#00b652] hover:bg-green-600 text-white rounded font-semibold"
                        >
                            Update Chart
                        </button>
                    </form>
                </div>

                {/* Chart Area */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity size={24} className="text-[#7e1fff]" />
                            {ticker}.NS Price Chart
                        </h2>
                        <a
                            href={`https://www.tradingview.com/chart/?symbol=NSE:${ticker}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold flex items-center gap-2 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 3h18v18H3V3zm16 16V5H5v14h14z" />
                            </svg>
                            View in TradingView
                        </a>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center" style={{ height: '400px' }}>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="flex items-center justify-center" style={{ height: '400px' }}>
                            <p className="text-gray-500">No chart data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7e1fff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#7e1fff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}
                                    formatter={(value) => [`₹${value}`, 'Price']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="close"
                                    stroke="#7e1fff"
                                    strokeWidth={2}
                                    fill="url(#colorPrice)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Technical Indicators */}
                {indicators && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* RSI */}
                        <div className="bg-white rounded border border-gray-300 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Activity size={20} className="text-[#7e1fff]" />
                                RSI (14)
                            </h3>
                            <div className="text-4xl font-bold mb-2" style={{
                                color: indicators.rsi > 70 ? '#ff333a' : indicators.rsi < 30 ? '#00b652' : '#7e1fff'
                            }}>
                                {indicators.rsi ? indicators.rsi.toFixed(2) : 'N/A'}
                            </div>
                            <p className="text-sm text-gray-600">
                                {indicators.rsi > 70 ? '🔴 Overbought' :
                                    indicators.rsi < 30 ? '🟢 Oversold' :
                                        '🟡 Neutral'}
                            </p>
                        </div>

                        {/* MACD */}
                        <div className="bg-white rounded border border-gray-300 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                {indicators.macd?.histogram >= 0 ?
                                    <TrendingUp size={20} className="text-[#00b652]" /> :
                                    <TrendingDown size={20} className="text-[#ff333a]" />
                                }
                                MACD
                            </h3>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Value:</span>
                                    <span className="font-semibold">{indicators.macd?.value || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Signal:</span>
                                    <span className="font-semibold">{indicators.macd?.signal || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Histogram:</span>
                                    <span className={`font-semibold ${indicators.macd?.histogram >= 0 ? 'text-[#00b652]' : 'text-[#ff333a]'
                                        }`}>
                                        {indicators.macd?.histogram || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bollinger Bands */}
                        <div className="bg-white rounded border border-gray-300 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Activity size={20} className="text-orange-500" />
                                Bollinger Bands (20)
                            </h3>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Upper:</span>
                                    <span className="font-semibold">₹{indicators.bollingerBands?.upper || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Middle:</span>
                                    <span className="font-semibold">₹{indicators.bollingerBands?.middle || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Lower:</span>
                                    <span className="font-semibold">₹{indicators.bollingerBands?.lower || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Panel */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Data Source:</strong> All price data and technical indicators are calculated from live Chief Investment Officer(CIO) data.
                        Charts update automatically when you change the ticker or timeframe.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TechnicalView;
