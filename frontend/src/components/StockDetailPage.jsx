import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { getStockAnalysis, getStockFinancials, getStockHolders, getStockHistory } from '../services/api';

const StockDetailPage = ({ ticker, onClose }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [stockData, setStockData] = useState(null);
    const [financials, setFinancials] = useState(null);
    const [holders, setHolders] = useState(null);
    const [historyData, setHistoryData] = useState([]); // For Historical Data Tab
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStockData(true);

        // Auto-refresh every 10 seconds for real-time updates (silent refresh)
        const refreshInterval = setInterval(() => {
            loadStockData(false);
        }, 10000);

        return () => clearInterval(refreshInterval);
    }, [ticker]);

    // Fetch tab-specific data when active tab changes
    useEffect(() => {
        const fetchTabData = async () => {
            if (activeTab === 'financials' && !financials) {
                const data = await getStockFinancials(ticker);
                setFinancials(data || {});
            } else if (activeTab === 'holders' && !holders) {
                const data = await getStockHolders(ticker);
                setHolders(data || {});
            } else if (activeTab === 'historical' && historyData.length === 0) {
                const data = await getStockHistory(ticker, '1y', '1d');
                setHistoryData(data || []);
            }
        };
        fetchTabData();
    }, [activeTab, ticker]);

    const loadStockData = async (showLoading = true) => {
        console.log('StockDetailPage: Loading data for', ticker);
        if (showLoading) setLoading(true);
        try {
            const data = await getStockAnalysis(ticker);
            console.log('StockDetailPage: Received data', data);
            setStockData(data);
        } catch (error) {
            console.error('StockDetailPage: Failed to load stock data:', error);
            setStockData({
                fundamentals: {},
                live_data: { price: 0, change: 0, changePct: 0 },
                news_sentiment: { articles: [] }
            });
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    if (loading && !stockData) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading {ticker}...</p>
                </div>
            </div>
        );
    }

    if (!stockData) return null;

    const { live_data = {}, fundamentals = {} } = stockData;
    const priceChange = live_data.change || 0;
    const isPositive = priceChange >= 0;

    return (
        <div className="fixed inset-0 bg-[#f6f6f6] z-[99999] overflow-y-auto w-full h-full text-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {ticker}
                            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">NSE</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold tracking-tight">
                                ₹{live_data.price?.toFixed(2)}
                            </span>
                            <span className={`text-sm font-semibold px-2 py-1 rounded flex items-center gap-1 ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({live_data.changePct?.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>
                <div className="hidden md:block text-right">
                    <div className="text-sm text-slate-500">Last Updated</div>
                    <div className="font-semibold">{new Date().toLocaleTimeString()}</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 px-4 sticky top-[88px] z-[90]">
                <div className="max-w-7xl mx-auto flex gap-6 overflow-x-auto no-scrollbar">
                    {['Summary', 'Chart', 'Statistics', 'Historical', 'Financials', 'Holders', 'Analysis'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.toLowerCase()
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {activeTab === 'summary' && <SummaryTab stockData={stockData} ticker={ticker} />}
                {activeTab === 'chart' && <ChartTab stockData={stockData} ticker={ticker} />}
                {activeTab === 'financials' && <FinancialsTab financials={financials} ticker={ticker} />}
                {activeTab === 'analysis' && <AnalysisTab stockData={stockData} />}
                {activeTab === 'statistics' && <StatisticsTab stockData={stockData} />}
                {activeTab === 'historical' && <HistoricalTab historyData={historyData} ticker={ticker} />}
                {activeTab === 'holders' && <HoldersTab holders={holders} />}
            </div>
        </div>
    );
};

// Summary Tab Component
const SummaryTab = ({ stockData, ticker }) => {
    // Use CURRENT backend data structure
    const fundamentals = stockData?.fundamentals || {};
    const technical = stockData?.analysis?.technical || {};
    const newsItems = stockData?.analysis?.news_summary || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
                {/* Key Statistics Card */}
                <div className="bg-white border border-gray-200 rounded p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Key Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatItem label="Market Cap" value={formatMarketCap(fundamentals.marketCap)} />
                        <StatItem label="P/E Ratio" value={fundamentals.trailingPE?.toFixed(2)} />
                        <StatItem label="Dividend Yield" value={fundamentals.dividendYield ? `${(fundamentals.dividendYield * 100).toFixed(2)}%` : 'N/A'} />
                        <StatItem label="Beta" value={fundamentals.beta?.toFixed(2)} />
                        <StatItem label="52W High" value={fundamentals.fiftyTwoWeekHigh ? `₹${fundamentals.fiftyTwoWeekHigh.toFixed(2)}` : 'N/A'} />
                        <StatItem label="52W Low" value={fundamentals.fiftyTwoWeekLow ? `₹${fundamentals.fiftyTwoWeekLow.toFixed(2)}` : 'N/A'} />
                        <StatItem label="EPS (TTM)" value={fundamentals.trailingEps?.toFixed(2)} />
                        <StatItem label="P/B Ratio" value={fundamentals.priceToBook?.toFixed(2)} />
                    </div>
                </div>

                {/* Company Profile Card */}
                <div className="bg-white border border-gray-200 rounded p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">About {fundamentals.shortName || ticker}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {fundamentals.longBusinessSummary || "No description available for this stock."}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500">Sector:</span>
                            <span className="ml-2 font-medium text-slate-900">{fundamentals.sector || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Industry:</span>
                            <span className="ml-2 font-medium text-slate-900">{fundamentals.industry || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Employees:</span>
                            <span className="ml-2 font-medium text-slate-900">{fundamentals.fullTimeEmployees?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Website:</span>
                            {fundamentals.website ? (
                                <a href={fundamentals.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-purple-600 hover:underline flex-inline items-center gap-1">
                                    {fundamentals.website} <ExternalLink size={12} className="inline" />
                                </a>
                            ) : <span className="ml-2 text-slate-900">N/A</span>}
                        </div>
                    </div>
                </div>

                {/* Technical Analysis Preview */}
                <div className="bg-white border border-gray-200 rounded p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Technical Indicators</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatItem label="RSI (14)" value={technical.RSI ? technical.RSI.toFixed(2) : 'N/A'} />
                        <StatItem label="MACD Line" value={technical.MACD_Line ? technical.MACD_Line.toFixed(2) : 'N/A'} />
                        <StatItem label="SMA (50)" value={technical.SMA_50 ? `₹${technical.SMA_50.toFixed(2)}` : 'N/A'} />
                        <StatItem label="EMA (200)" value={technical.EMA_200 ? `₹${technical.EMA_200.toFixed(2)}` : 'N/A'} />
                    </div>
                </div>
            </div>

            {/* Right Column - Analysis & News */}
            <div className="space-y-6">
                {/* AI Analysis Card */}
                <div className="bg-white border border-gray-200 rounded p-6 shadow-sm ring-1 ring-purple-100">
                    <h3 className="font-bold text-lg mb-3 text-slate-900 flex items-center gap-2">
                        <span>🤖 AI Verdict</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600 text-sm font-medium">Signal</span>
                            <span className={`font-bold px-3 py-1 rounded text-sm ${stockData.signal === 'BUY' ? 'bg-green-100 text-green-700' : stockData.signal === 'SELL' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                {stockData.signal || 'HOLD'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600 text-sm font-medium">Risk Profile</span>
                            <span className={`font-bold px-3 py-1 rounded text-sm ${stockData.risk === 'HIGH' ? 'bg-red-100 text-red-700' : stockData.risk === 'LOW' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                {stockData.risk || 'MEDIUM'}
                            </span>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Drivers</h4>
                            <ul className="space-y-2">
                                {(stockData.analysis?.reasoning || '').split('; ').map((reason, idx) => (
                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                        <span className="text-purple-500 mt-1">•</span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* News Card */}
                <div className="bg-white border border-gray-200 rounded p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Recent Headlines</h3>
                    <div className="space-y-4">
                        {newsItems.length > 0 ? newsItems.slice(0, 5).map((article, i) => (
                            <a
                                key={i}
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <h4 className="font-semibold text-sm text-slate-900 leading-snug group-hover:text-purple-700 transition-colors">
                                    {article.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-medium text-slate-500">{article.media}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs text-slate-400">{article.date}</span>
                                </div>
                            </a>
                        )) : (
                            <p className="text-sm text-slate-500 italic">No recent news available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatItem = ({ label, value }) => (
    <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
);

// Chart Tab - Simple price table from history data
const ChartTab = ({ stockData, ticker }) => {
    const history = stockData?.history || [];

    return (
        <div className="bg-white border border-gray-200 rounded p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Intraday Price History (5-min intervals)</h3>
            {history.length > 0 ? (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-100 border-b">
                            <tr>
                                <th className="text-left p-2 font-semibold text-slate-700">Time</th>
                                <th className="text-right p-2 font-semibold text-slate-700">Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-slate-50">
                                    <td className="p-2 text-slate-900">{new Date(item.time).toLocaleTimeString('en-IN')}</td>
                                    <td className="p-2 text-right font-semibold text-slate-900">{item.price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-slate-500 py-8">No price history available</p>
            )}
            <p className="text-xs text-slate-500 mt-4 text-center">Full interactive candlestick charts coming soon</p>
        </div>
    );
};

// Financials Tab
const FinancialsTab = ({ financials, ticker }) => {
    const [view, setView] = useState('income_stmt');

    if (!financials) {
        return (
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading financials...</p>
            </div>
        );
    }

    const currentData = financials[view] || {};
    // Extract years (keys of the inner objects)
    const firstMetric = Object.values(currentData)[0] || {};
    const years = Object.keys(firstMetric).sort().reverse();
    const metrics = Object.keys(currentData);

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center overflow-x-auto pb-2">
                <button onClick={() => setView('income_stmt')} className={`px-4 py-2 rounded font-semibold text-sm whitespace-nowrap ${view === 'income_stmt' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-slate-700'}`}>
                    Income Statement
                </button>
                <button onClick={() => setView('balance_sheet')} className={`px-4 py-2 rounded font-semibold text-sm whitespace-nowrap ${view === 'balance_sheet' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-slate-700'}`}>
                    Balance Sheet
                </button>
                <button onClick={() => setView('cash_flow')} className={`px-4 py-2 rounded font-semibold text-sm whitespace-nowrap ${view === 'cash_flow' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-slate-700'}`}>
                    Cash Flow
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded overflow-x-auto">
                {metrics.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left p-3 font-semibold text-slate-700 w-1/3">Breakdown</th>
                                {years.map(year => (
                                    <th key={year} className="text-right p-3 font-semibold text-slate-700">{new Date(year).getFullYear()}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map((metric, idx) => (
                                <tr key={metric} className="border-b border-gray-100 hover:bg-slate-50 last:border-0">
                                    <td className="p-3 text-slate-900 font-medium">{metric}</td>
                                    {years.map(year => (
                                        <td key={year} className="p-3 text-right text-slate-600">
                                            {formatLargeNumber(currentData[metric][year])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-slate-500">No financial data available</div>
                )}
            </div>
        </div>
    );
};

// Analysis Tab
const AnalysisTab = ({ stockData }) => {
    const technical = stockData?.analysis?.technical || {};
    const sentiment = stockData?.analysis?.sentiment || {};
    const reasoning = stockData?.analysis?.reasoning || '';
    const fundamentals = stockData?.fundamentals || {};

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Trading Analysis</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-slate-50 rounded">
                            <div className="text-xs text-slate-600 mb-1">Signal</div>
                            <div className={`text-xl font-bold ${stockData.signal === 'BUY' ? 'text-green-600' : stockData.signal === 'SELL' ? 'text-red-600' : 'text-slate-600'}`}>
                                {stockData.signal || 'HOLD'}
                            </div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded">
                            <div className="text-xs text-slate-600 mb-1">Risk</div>
                            <div className={`text-xl font-bold ${stockData.risk === 'HIGH' ? 'text-red-600' : stockData.risk === 'LOW' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {stockData.risk || 'MEDIUM'}
                            </div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded">
                            <div className="text-xs text-slate-600 mb-1">Sentiment</div>
                            <div className="text-xl font-bold text-slate-900">{sentiment.sentiment || 'NEUTRAL'}</div>
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">AI Analysis Summary</h4>
                        <ul className="space-y-2">
                            {reasoning.split('; ').map((r, i) => (
                                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    {r}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Analyst Targets */}
                <div className="bg-white border border-gray-200 rounded p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Analyst Targets</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-slate-600">Recommendation</span>
                            <span className="font-bold text-slate-900 uppercase">{fundamentals.recommendationKey || 'N/A'}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Target Low</span>
                                <span className="font-semibold">₹{fundamentals.targetLowPrice?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Target Mean</span>
                                <span className="font-semibold">₹{fundamentals.targetMeanPrice?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Target High</span>
                                <span className="font-semibold">₹{fundamentals.targetHighPrice?.toFixed(2) || 'N/A'}</span>
                            </div>
                            {fundamentals.targetMeanPrice && (
                                <div className="mt-2 text-xs text-center text-slate-500">
                                    Current Price: ₹{stockData.live_data?.price?.toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Statistics Tab
const StatisticsTab = ({ stockData }) => {
    const technical = stockData?.analysis?.technical || {};
    const riskMetrics = stockData?.risk_metrics || {};
    const fundamentals = stockData?.fundamentals || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Valuation Measures */}
            <div className="bg-white border border-gray-200 rounded p-4">
                <h3 className="font-bold mb-4 text-slate-900">Valuation Measures</h3>
                <div className="space-y-3">
                    <StatRow label="Market Cap" value={formatMarketCap(fundamentals.marketCap)} />
                    <StatRow label="Enterprise Value" value={formatLargeNumber(fundamentals.enterpriseValue)} />
                    <StatRow label="Trailing P/E" value={fundamentals.trailingPE?.toFixed(2)} />
                    <StatRow label="Forward P/E" value={fundamentals.forwardPE?.toFixed(2)} />
                    <StatRow label="PEG Ratio (5yr exp)" value={fundamentals.pegRatio?.toFixed(2)} />
                    <StatRow label="Price/Sales" value={fundamentals.priceToSalesTrailing12Months?.toFixed(2)} />
                    <StatRow label="Price/Book" value={fundamentals.priceToBook?.toFixed(2)} />
                    <StatRow label="EV/Revenue" value={fundamentals.enterpriseToRevenue?.toFixed(2)} />
                    <StatRow label="EV/EBITDA" value={fundamentals.enterpriseToEbitda?.toFixed(2)} />
                </div>
            </div>

            {/* Financial Highlights */}
            <div className="bg-white border border-gray-200 rounded p-4">
                <h3 className="font-bold mb-4 text-slate-900">Financial Highlights</h3>
                <div className="space-y-3">
                    <StatRow label="Profit Margin" value={fundamentals.profitMargins ? `${(fundamentals.profitMargins * 100).toFixed(2)}%` : null} />
                    <StatRow label="Operating Margin" value={fundamentals.operatingMargins ? `${(fundamentals.operatingMargins * 100).toFixed(2)}%` : null} />
                    <StatRow label="Return on Assets" value={fundamentals.returnOnAssets ? `${(fundamentals.returnOnAssets * 100).toFixed(2)}%` : null} />
                    <StatRow label="Return on Equity" value={fundamentals.returnOnEquity ? `${(fundamentals.returnOnEquity * 100).toFixed(2)}%` : null} />
                    <StatRow label="Revenue (TTM)" value={formatLargeNumber(fundamentals.totalRevenue)} />
                    <StatRow label="Net Income (TTM)" value={formatLargeNumber(fundamentals.netIncomeToCommon)} />
                    <StatRow label="Diluted EPS (TTM)" value={fundamentals.trailingEps?.toFixed(2)} />
                    <StatRow label="Total Cash" value={formatLargeNumber(fundamentals.totalCash)} />
                    <StatRow label="Total Debt" value={formatLargeNumber(fundamentals.totalDebt)} />
                </div>
            </div>

            {/* Technical Statistics */}
            <div className="bg-white border border-gray-200 rounded p-4">
                <h3 className="font-bold mb-4 text-slate-900">Technical Statistics</h3>
                <div className="space-y-3">
                    <StatRow label="RSI (14)" value={technical.RSI?.toFixed(2)} />
                    <StatRow label="Beta (5Y Monthly)" value={fundamentals.beta?.toFixed(2)} />
                    <StatRow label="52-Week Change" value={fundamentals['52WeekChange'] ? `${(fundamentals['52WeekChange'] * 100).toFixed(2)}%` : null} />
                    <StatRow label="S&P500 52-Week Change" value={fundamentals['SandP52WeekChange'] ? `${(fundamentals['SandP52WeekChange'] * 100).toFixed(2)}%` : null} />
                    <StatRow label="52 Week High" value={fundamentals.fiftyTwoWeekHigh?.toFixed(2)} />
                    <StatRow label="52 Week Low" value={fundamentals.fiftyTwoWeekLow?.toFixed(2)} />
                    <StatRow label="50-Day Moving Avg" value={fundamentals.fiftyDayAverage?.toFixed(2)} />
                    <StatRow label="200-Day Moving Avg" value={fundamentals.twoHundredDayAverage?.toFixed(2)} />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
                <h3 className="font-bold mb-4 text-slate-900">Trading Indicators</h3>
                <div className="space-y-3">
                    <StatRow label="MACD Line" value={technical.MACD_Line?.toFixed(2)} />
                    <StatRow label="MACD Signal" value={technical.MACD_Signal?.toFixed(2)} />
                    <StatRow label="ADX" value={technical.ADX?.toFixed(2)} />
                    <StatRow label="ATR" value={technical.ATR?.toFixed(2)} />
                    <StatRow label="Volatility" value={riskMetrics.volatility?.toFixed(2)} />
                </div>
            </div>
        </div>
    );
};

const StatRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{value || 'N/A'}</span>
    </div>
);

// Historical Data Tab
const HistoricalTab = ({ historyData, ticker }) => {
    if (!historyData) {
        return (
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading historical data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="p-4 border-b border-gray-200 font-bold text-lg text-slate-900">
                Historical Prices (1 Year)
            </div>
            {historyData.length > 0 ? (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b sticky top-0">
                            <tr>
                                <th className="text-left p-3 font-semibold text-slate-700">Date</th>
                                <th className="text-right p-3 font-semibold text-slate-700">Open</th>
                                <th className="text-right p-3 font-semibold text-slate-700">High</th>
                                <th className="text-right p-3 font-semibold text-slate-700">Low</th>
                                <th className="text-right p-3 font-semibold text-slate-700">Close</th>
                                <th className="text-right p-3 font-semibold text-slate-700">Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.slice().reverse().map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-slate-50">
                                    <td className="p-3 text-slate-900">{new Date(row.Date).toLocaleDateString()}</td>
                                    <td className="p-3 text-right text-slate-600">₹{row.Open.toFixed(2)}</td>
                                    <td className="p-3 text-right text-slate-600">₹{row.High.toFixed(2)}</td>
                                    <td className="p-3 text-right text-slate-600">₹{row.Low.toFixed(2)}</td>
                                    <td className="p-3 text-right font-semibold text-slate-900">₹{row.Close.toFixed(2)}</td>
                                    <td className="p-3 text-right text-slate-600">{row.Volume.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center text-slate-500">No historical data available</div>
            )}
        </div>
    );
};

// Holders Tab
const HoldersTab = ({ holders }) => {
    if (!holders) {
        return (
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading holders data...</p>
            </div>
        );
    }

    // Major Holders parsing (often varied structure from yfinance)
    const renderMajorHolders = () => {
        const major = holders.major || {};
        // yfinance major_holders is weird, sometimes dict of {0: value, 1: label}
        // Let's try to parse varied formats logic here would be complex without seeing real data
        // Assuming list or dict based on typical output
        return (
            <div className="overflow-x-auto">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(major, null, 2)}</pre>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-900">Major Holders</h3>
                {Object.keys(holders.major || {}).length > 0 ? (
                    renderMajorHolders()
                ) : (
                    <p className="text-slate-500">No major holders data available</p>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-900">Institutional Holders</h3>
                {Object.keys(holders.institutional || {}).length > 0 ? (
                    <div className="overflow-x-auto">
                        <pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(holders.institutional, null, 2)}</pre>
                    </div>
                ) : (
                    <p className="text-slate-500">No institutional holders data available</p>
                )}
            </div>
        </div>
    );
};

// Helper for large numbers
const formatLargeNumber = (num) => {
    if (!num) return '-';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
};

const formatMarketCap = (num) => formatLargeNumber(num);
const formatVolume = (num) => formatLargeNumber(num);

const formatFinancialNumber = (value) => {
    if (value === null || value === undefined) return '-';
    return formatMarketCap(value);
};

export default StockDetailPage;
