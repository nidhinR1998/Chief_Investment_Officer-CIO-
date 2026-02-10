import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { getMarketSummary, getTrendingStocks, getLatestNews } from '../services/api';

const HomeView = ({ onStockClick }) => {
    const [marketSummary, setMarketSummary] = useState([]);
    const [trending, setTrending] = useState([]);
    const [news, setNews] = useState([]);

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        const loadData = async () => {
            try {
                const [summaryData, trendingData, newsData] = await Promise.all([
                    getMarketSummary(),
                    getTrendingStocks(),
                    getLatestNews()
                ]);

                if (summaryData && summaryData.data) {
                    setMarketSummary(summaryData.data);
                }

                if (trendingData && trendingData.data) {
                    setTrending(trendingData.data);
                }

                if (newsData && Array.isArray(newsData)) {
                    setNews(newsData);
                }
            } catch (error) {
                console.error("Failed to load HomeView data", error);
            }
        };

        loadData(); // Initial load
        const interval = setInterval(loadData, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const handleStockClick = (symbol) => {
        if (onStockClick) {
            onStockClick(symbol);
        }
    };

    const handleNewsClick = (url) => {
        if (!url || url === '#' || url.trim() === '') return;
        console.log("Opening news URL:", url);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="bg-[#f8f9fa] min-h-screen font-sans">
            {/* Market Summary Ticker - Compact & Modern */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-3">
                    <div className="flex justify-between items-center gap-6 overflow-x-auto no-scrollbar pb-1">
                        {marketSummary.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded transition-colors min-w-[180px]"
                                onClick={() => handleStockClick(item.symbol)}
                            >
                                <div>
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.name}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-slate-900">{item.price}</span>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.change}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Trending & Market Data (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Trending Section */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-600" />
                                Trending
                            </h3>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full uppercase tracking-wide">Live</span>
                        </div>
                        <div className="space-y-1">
                            {trending.map((s, i) => (
                                <div
                                    key={i}
                                    className="group flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors px-2 -mx-2 rounded"
                                    onClick={() => handleStockClick(s.symbol)}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">{s.symbol}</div>
                                        <div className="text-xs text-gray-400 font-medium">{s.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-900">{s.price}</div>
                                        <div className={`text-xs font-bold ${s.isUp ? 'text-green-600' : 'text-red-600'}`}>
                                            {s.change}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => onStockClick('screener')}
                            className="w-full mt-4 text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2 rounded hover:bg-indigo-50 transition-colors"
                        >
                            View Screener
                        </button>
                    </div>

                    {/* Market Sectors */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide text-gray-500">Market Data</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['Currencies', 'Futures', 'Options', 'Commodities'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onStockClick && onStockClick(`MARKET:${cat.toLowerCase()}`)}
                                    className="text-left px-4 py-3 bg-gray-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-gray-100 rounded-lg text-sm font-semibold transition-all"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Column: News Feed (6 cols) */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Top Stories</h2>
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Refresh</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {news.map((item, i) => (
                            <div
                                key={i}
                                className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col ${i === 0 ? 'md:col-span-2 md:flex-row md:items-stretch' : ''}`}
                                onClick={() => item.link && handleNewsClick(item.link)}
                            >
                                <div className={`relative overflow-hidden bg-gray-200 ${i === 0 ? 'md:w-2/5 h-48 md:h-auto' : 'h-48'}`}>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt="news"
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                // Use a reliable placeholder service with specific text
                                                e.target.src = `https://placehold.co/600x400/e2e8f0/475569?text=Market+News`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                            <div className="text-center">
                                                <span className="text-4xl">📰</span>
                                                <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wide">News</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                                        {item.media || 'Market News'}
                                    </div>
                                </div>

                                <div className={`p-5 flex flex-col justify-between ${i === 0 ? 'md:w-3/5' : ''}`}>
                                    <div>
                                        <h3 className={`font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors mb-2 ${i === 0 ? 'text-xl' : 'text-lg'}`}>
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                                            {item.desc || item.summary || 'Click to read full story...'}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-4 border-t border-gray-50">
                                        <span>{item.date || item.time}</span>
                                        <span className="flex items-center gap-1 text-indigo-500 group-hover:underline">
                                            Read more <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Portfolio & Insights (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Portfolio Card */}
                    <div className="bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">My Portfolio</h3>
                            <p className="text-indigo-200 text-sm mb-6">Track your wealth in real-time</p>

                            <button
                                onClick={() => window.location.hash = '#portfolio'}
                                className="w-full bg-white text-indigo-900 font-bold py-3 px-4 rounded-lg hover:bg-indigo-50 transition-colors shadow-md text-sm"
                            >
                                Go to Portfolio
                            </button>
                        </div>
                        {/* Decorative background circles */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-indigo-500 opacity-20 rounded-full blur-xl"></div>
                    </div>

                    {/* Tools List */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide text-gray-500">Tools</h4>
                        <div className="space-y-2">
                            {[
                                { name: 'Stock Screener', id: 'screener', icon: '🔍' },
                                { name: 'Technical Analysis', id: 'technical', icon: '📈' },
                                { name: 'Economic Calendar', id: 'calendar', icon: '📅' },
                                { name: 'Watchlist', id: 'watchlist', icon: '⭐' }
                            ].map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => onStockClick(tool.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <span className="text-slate-700 font-medium flex items-center gap-3">
                                        <span className="text-lg opacity-80">{tool.icon}</span> {tool.name}
                                    </span>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Insight Teaser */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                            <div className="bg-indigo-600 text-white p-2 rounded-lg mt-1">
                                <TrendingUp size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900 mb-1">Market Insight</h4>
                                <p className="text-xs text-indigo-800 leading-relaxed mb-3">
                                    Nifty 50 is showing strong bullish momentum above 24,000 levels driven by IT and Banking sectors.
                                </p>
                                <button className="text-xs font-bold text-indigo-700 hover:text-indigo-900 uppercase tracking-wide">
                                    View Analysis
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;
