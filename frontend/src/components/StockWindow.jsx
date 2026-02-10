import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ArrowUp, ArrowDown, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { getStockAnalysis, startMonitoring, stopMonitoring } from '../services/api';
import StockChart from './Chart';

const StockWindow = ({ ticker, context, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('Overview');
    const [wsStatus, setWsStatus] = useState('disconnected'); // connected, disconnected
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        fetchData();
        startMonitoring(ticker).catch(console.error);

        // Robust WebSocket Connection
        let ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
            console.log("Connected to Real-time Stream");
            setWsStatus('connected');
        };

        ws.onclose = () => {
            console.log("Disconnected from Real-time Stream");
            setWsStatus('disconnected');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                const msgTickerClean = msg.ticker.replace('.NS', '').replace('.BO', '');
                const propTickerClean = ticker.replace('.NS', '').replace('.BO', '');

                if (msg.type === 'STOCK_UPDATE' && msgTickerClean === propTickerClean && msg.data) {
                    console.log("Update received for", ticker);
                    setData(prevData => {
                        if (!prevData) return msg.data;
                        // specific merge: keep fundamentals/history if not in update or empty
                        const newFundamentals = (msg.data.fundamentals && Object.keys(msg.data.fundamentals).length > 0)
                            ? msg.data.fundamentals
                            : prevData.fundamentals;

                        return {
                            ...prevData,
                            ...msg.data,
                            fundamentals: newFundamentals,
                            history: msg.data.history || prevData.history,
                            analysis: {
                                ...prevData.analysis,
                                ...msg.data.analysis
                            }
                        };
                    });
                    setLoading(false);
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        return () => {
            stopMonitoring(ticker).catch(console.error);
            ws.close();
        };
    }, [ticker, context]); // Add context dependency

    const [error, setError] = useState(null);

    useEffect(() => {
        setError(null);
        fetchData();
        startMonitoring(ticker).catch(console.error);
        // ... WS Logic ... (remains same, just implied context)
    }, [ticker, context]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getStockAnalysis(ticker, context);
            if (result.error || result.signal === 'ERROR') {
                setError(result.error || result.analysis?.reasoning || "Failed to load stock data");
                return;
            }
            setData(result);
        } catch (err) {
            console.error(err);
            setError("Failed to load stock data. Backend may be offline.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[400px] bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Activity className="animate-spin text-cyan-500" size={24} />
                    <span className="text-xs text-slate-500 font-mono">LOADING DATA...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[400px] bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-red-500">
                    <X size={32} />
                    <span className="text-sm font-bold">{error}</span>
                    <button onClick={fetchData} className="text-xs underline hover:text-red-400">Retry</button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={`transition-all duration-300 bg-slate-900 border border-slate-800 shadow-sm flex flex-col overflow-hidden hover:border-slate-700 text-white
            ${isMaximized ? 'fixed inset-0 z-50 h-screen w-screen m-0 rounded-none' : 'relative h-[750px] rounded-lg resize-y'}`}>
            {/* Widget Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${data.signal === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none">{ticker}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">NSE • 15 MIN DELAY</span>
                            {wsStatus === 'connected' ? (
                                <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> LIVE
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> OFFLINE
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="text-lg font-mono font-medium text-white mb-1">₹{data.price}</div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsMaximized(!isMaximized)} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-full p-1.5" title={isMaximized ? "Minimize" : "Maximize"}>
                            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                        <button onClick={() => onClose(ticker)} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-full p-1.5">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex border-b border-slate-800 bg-slate-900">
                {['Overview', 'Technicals', 'Fundamentals', 'Risk', 'News'].map(v => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${view === v ? 'border-cyan-500 text-cyan-400 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    >
                        {v}
                    </button>
                ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4">

                {view === 'Overview' && (
                    <div className="h-full flex flex-col">
                        {/* AI Signal Badge and Confidence */}
                        <div className="flex items-center gap-4 mb-3">
                            <div className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-2 ${data.signal.includes('BUY') ? 'bg-green-950 text-green-400 border border-green-900' : data.signal.includes('SELL') ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                                {data.signal.includes('BUY') ? <ArrowUp size={12} /> : data.signal.includes('SELL') ? <ArrowDown size={12} /> : <Activity size={12} />}
                                {data.signal}
                            </div>
                            <span className="text-xs text-slate-500">Confidence: <span className="text-white">{data.confidence.toFixed(1)}%</span></span>
                        </div>

                        {/* Real-time Analysis Report */}
                        <div className="mb-3 bg-slate-900 border border-slate-800 rounded p-3">
                            <h4 className="text-[10px] text-cyan-400 font-bold uppercase mb-2 flex items-center gap-2">
                                <Activity size={12} /> Real-time Analysis Breakdown
                            </h4>
                            {data.analysis.reasoning_list && data.analysis.reasoning_list.length > 0 ? (
                                <ul className="space-y-1">
                                    {data.analysis.reasoning_list.map((reason, idx) => (
                                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-slate-500 shrink-0"></span>
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-500 italic">" {data.analysis.reasoning || "Analyzing market conditions..."} "</p>
                            )}
                        </div>

                        {/* Chart */}
                        <div className="flex-1 bg-slate-900 rounded border border-slate-800 p-2 relative min-h-0">
                            <StockChart ticker={ticker} />
                        </div>
                    </div>
                )}

                {view === 'Technicals' && (
                    <div className="space-y-4">
                        {/* Primary Trend Indicators */}
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="RSI (14)" value={data.analysis.technical?.RSI?.toFixed(1)} active={data.analysis.technical?.RSI < 30 || data.analysis.technical?.RSI > 70} trend={data.analysis.technical?.RSI > 50 ? 'up' : 'down'} />
                            <MetricCard label="MACD" value={data.analysis.technical?.MACD_Line?.toFixed(1)} trend={data.analysis.technical?.MACD_Line > 0 ? 'up' : 'down'} />
                            <MetricCard label="ADX (Strength)" value={data.analysis.technical?.ADX?.toFixed(1)} active={data.analysis.technical?.ADX > 25} />
                            <MetricCard label="EMA 200 (Trend)" value={data.analysis.technical?.EMA_200?.toFixed(1)} active={data.price > data.analysis.technical?.EMA_200} />
                        </div>

                        {/* Advanced Momentum & Volume */}
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 border-b border-slate-800 pb-1">Advanced Indicators</div>
                            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                <MiniMetric label="Stoch K" value={data.analysis.technical.Stoch_K?.toFixed(1)} />
                                <MiniMetric label="Williams ROC" value={data.analysis.technical.ROC?.toFixed(2) + "%"} color={data.analysis.technical.ROC > 0 ? 'text-green-400' : 'text-red-400'} />
                                <MiniMetric label="KST (Momentum)" value={data.analysis.technical.KST?.toFixed(2)} />
                                <MiniMetric label="Parabolic SAR" value={data.analysis.technical.PSAR?.toFixed(1)} />
                                <MiniMetric label="Pivot Point" value={data.analysis.technical.Pivot?.toFixed(1)} />
                                <MiniMetric label="OBV" value={formatCompact(data.analysis.technical.OBV)} />
                            </div>
                        </div>

                        {/* Band Visualization */}
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Bollinger Bands (20, 2)</div>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-400">Lower: <span className="text-white">{data.analysis.technical.BBL_Lower?.toFixed(2)}</span></span>
                                <span className="text-slate-400">Mid: <span className="text-cyan-400">{data.analysis.technical.BBM_Mid?.toFixed(2)}</span></span>
                                <span className="text-slate-400">Upper: <span className="text-white">{data.analysis.technical.BBU_Upper?.toFixed(2)}</span></span>
                            </div>
                            <div className="mt-2 h-1.5 bg-slate-800 rounded-full relative">
                                <div
                                    className="absolute top-0 bottom-0 bg-cyan-600 rounded-full w-2 h-2 -ml-1 mt-[-1px]"
                                    style={{
                                        left: `${Math.min(100, Math.max(0, ((data.price - data.analysis.technical.BBL_Lower) / (data.analysis.technical.BBU_Upper - data.analysis.technical.BBL_Lower)) * 100))}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'Fundamentals' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-white font-bold text-lg">{data.fundamentals?.longName || data.ticker}</h4>
                                    <div className="text-xs text-slate-500">{data.fundamentals?.sector} • {data.fundamentals?.industry}</div>
                                </div>
                                {data.fundamentals?.website && (
                                    <a href={data.fundamentals.website} target="_blank" rel="noreferrer" className="text-cyan-500 hover:underline flex items-center gap-1 text-xs">
                                        Website <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                                {data.fundamentals?.longBusinessSummary}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <MetricCard label="Market Cap" value={formatCompact(data.fundamentals?.marketCap)} />
                            <MetricCard label="Enterprise Value" value={formatCompact(data.fundamentals?.enterpriseValue)} />
                            <MetricCard label="P/E Ratio" value={data.fundamentals?.trailingPE?.toFixed(2)} />
                            <MetricCard label="Forward P/E" value={data.fundamentals?.forwardPE?.toFixed(2)} />
                            <MetricCard label="PEG Ratio" value={data.fundamentals?.pegRatio?.toFixed(2)} />
                            <MetricCard label="Price/Book" value={data.fundamentals?.priceToBook?.toFixed(2)} />
                        </div>

                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 mb-4">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 border-b border-slate-800 pb-1">Profitability & Financial Health</div>
                            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                <MiniMetric label="Profit Margin" value={(data.fundamentals?.profitMargins * 100)?.toFixed(2) + "%"} color={data.fundamentals?.profitMargins > 0 ? 'text-green-400' : 'text-red-400'} />
                                <MiniMetric label="Operating Margin" value={(data.fundamentals?.operatingMargins * 100)?.toFixed(2) + "%"} />
                                <MiniMetric label="ROA" value={(data.fundamentals?.returnOnAssets * 100)?.toFixed(2) + "%"} />
                                <MiniMetric label="ROE" value={(data.fundamentals?.returnOnEquity * 100)?.toFixed(2) + "%"} />
                                <MiniMetric label="Debt/Equity" value={data.fundamentals?.debtToEquity?.toFixed(2)} />
                                <MiniMetric label="Current Ratio" value={data.fundamentals?.currentRatio?.toFixed(2)} />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 mb-4">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 border-b border-slate-800 pb-1">Dividends & Returns</div>
                            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                <MiniMetric label="Dividend Yield" value={(data.fundamentals?.dividendYield * 100)?.toFixed(2) + "%"} />
                                <MiniMetric label="Dividend Rate" value={data.fundamentals?.dividendRate} />
                                <MiniMetric label="Payout Ratio" value={(data.fundamentals?.payoutRatio * 100)?.toFixed(2) + "%"} />
                                <MiniMetric label="52W High" value={data.fundamentals?.fiftyTwoWeekHigh?.toFixed(2)} />
                                <MiniMetric label="52W Low" value={data.fundamentals?.fiftyTwoWeekLow?.toFixed(2)} />
                                <MiniMetric label="Beta" value={data.fundamentals?.beta?.toFixed(2)} />
                            </div>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Analyst Targets</div>
                            <div className="flex justify-between items-center bg-slate-800 rounded p-2 mb-2">
                                <span className="text-xs text-slate-400">Target Mean:</span>
                                <span className="text-lg font-mono font-bold text-cyan-400">₹{data.fundamentals?.targetMeanPrice?.toFixed(2) || '-'}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>Low: {data.fundamentals?.targetLowPrice}</span>
                                <span>High: {data.fundamentals?.targetHighPrice}</span>
                            </div>
                            <div className="mt-2 text-center text-xs text-white font-bold bg-slate-800 py-1 rounded capitalize">
                                Recommendation: {data.fundamentals?.recommendationKey?.replace('_', ' ') || '-'}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'Risk' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Risk Profile</h4>

                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-bold text-white">{data.risk}</span>
                                <span className="text-xs text-slate-500 mb-1">RISK LEVEL</span>
                            </div>

                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${data.risk === 'HIGH' ? 'bg-red-500 w-full' : data.risk === 'MEDIUM' ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-1/3'}`}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="Volatility (ATR)" value={data.risk_metrics?.volatility?.toFixed(2)} />
                            <MetricCard label="Max Drawdown (1Y)" value={data.risk_metrics?.max_drawdown?.toFixed(2) + "%"} active={data.risk_metrics?.max_drawdown < -20} />
                            <MetricCard label="Resistance (R1)" value={data.analysis.technical.R1?.toFixed(1)} />
                            <MetricCard label="Support (S1)" value={data.analysis.technical.S1?.toFixed(1)} />
                        </div>

                        <div className="text-[10px] text-slate-500 p-2 bg-slate-900/50 rounded">
                            * Max Drawdown calculated over the last 1 year.
                        </div>
                    </div>
                )}

                {view === 'News' && (
                    <div className="space-y-3">
                        {data.analysis.news_summary.map((n, i) => (
                            <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block p-3 bg-slate-900 border border-slate-800 rounded hover:border-slate-600 transition-colors group">
                                <h4 className="text-sm text-slate-300 group-hover:text-cyan-400 line-clamp-2 leading-snug">{n.title}</h4>
                                <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                                    <span>{n.media}</span>
                                    <span>{n.date}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, active }) => (
    <div className={`p-3 rounded border ${active ? 'bg-slate-800 border-yellow-600/50' : 'bg-slate-900 border-slate-800'}`}>
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        <div className={`font-mono text-lg font-medium ${active ? 'text-yellow-500' : 'text-slate-200'}`}>{value || '-'}</div>
    </div>
);

const MiniMetric = ({ label, value, color }) => (
    <div>
        <div className="text-[9px] text-slate-500 uppercase mb-0.5">{label}</div>
        <div className={`font-mono text-sm font-bold ${color || 'text-slate-200'}`}>{value || '-'}</div>
    </div>
);

const formatCompact = (num) => {
    if (!num) return '-';
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

export default StockWindow;
