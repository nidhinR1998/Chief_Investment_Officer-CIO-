
import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown, Plus, Minus, RefreshCw, Wallet } from 'lucide-react';
import { getPortfolio, executeTrade } from '../services/api';

const PortfolioView = () => {
    const [data, setData] = useState({ cash: 0, holdings: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const result = await getPortfolio();
            setData(result); // { cash, holdings, total_invested }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll for updates every 5s
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleTrade = async (ticker, action, qty, price) => {
        try {
            await executeTrade({ ticker, action, quantity: parseInt(qty), price: parseFloat(price) });
            fetchData(); // Refresh immediately
        } catch (err) {
            alert(err.response?.data?.detail || "Trade failed");
        }
    };

    // Derived Metrics
    const holdings = data.holdings || [];
    const totalInvested = holdings.reduce((acc, h) => acc + h.invested_value, 0);
    const currentValue = holdings.reduce((acc, h) => acc + (h.quantity * h.current_price), 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const netWorth = data.cash + currentValue;

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header: Net Worth & Cash */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Wallet size={64} /></div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Net Worth</span>
                    <span className="text-2xl font-mono text-white font-bold">₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col justify-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Available Cash</span>
                    <span className="text-xl font-mono text-cyan-400 font-bold">₹{data.cash?.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col justify-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total P&L</span>
                    <div className={`text-xl font-mono font-bold flex items-center gap-2 ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        ₹{Math.abs(totalPnL).toFixed(2)} ({pnlPercent.toFixed(2)}%)
                    </div>
                </div>
            </div>

            {/* Main Content: Holdings & Allocation */}
            <div className="flex-1 flex gap-6 min-h-0">

                {/* Holdings List */}
                <div className="flex-[2] bg-slate-900 rounded-lg border border-slate-800 flex flex-col overflow-hidden">
                    <div className="grid grid-cols-6 bg-slate-950/50 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                        <div className="col-span-1">Ticker</div>
                        <div className="text-right">Qty</div>
                        <div className="text-right">Avg</div>
                        <div className="text-right">LTP</div>
                        <div className="text-right">Curr. Val</div>
                        <div className="text-right">Day P&L</div>
                    </div>

                    <div className="overflow-auto flex-1 p-2 space-y-1">
                        {holdings.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <PieChart size={40} className="mb-2 opacity-50" />
                                <span>No active positions</span>
                            </div>
                        ) : (
                            holdings.map(h => {
                                const marketVal = h.quantity * h.current_price;
                                const invested = h.invested_value;
                                const pnl = marketVal - invested;
                                const pnlP = (pnl / invested) * 100;

                                return (
                                    <div key={h.ticker} className="grid grid-cols-6 p-3 bg-slate-800/30 rounded border border-slate-800/50 items-center hover:bg-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="font-bold text-sm text-white">{h.ticker.replace('.NS', '')}</div>
                                        <div className="text-right font-mono text-xs text-slate-300">{h.quantity}</div>
                                        <div className="text-right font-mono text-xs text-slate-400">{h.average_price.toFixed(1)}</div>
                                        <div className="text-right font-mono text-xs text-white">{h.current_price.toFixed(1)}</div>
                                        <div className="text-right font-mono text-xs text-white">₹{marketVal.toLocaleString()}</div>
                                        <div className={`text-right font-mono text-xs font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {pnl > 0 ? '+' : ''}{pnlP.toFixed(1)}%
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Quick Trade Footer */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800">
                        <TradeForm onTrade={handleTrade} />
                    </div>
                </div>

                {/* Sidebar: Visual Allocation (Simple Bars for now) */}
                <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Allocation</h3>
                    <div className="space-y-3 overflow-auto">
                        {holdings.sort((a, b) => (b.quantity * b.current_price) - (a.quantity * a.current_price)).map(h => {
                            const val = h.quantity * h.current_price;
                            const percent = netWorth > 0 ? (val / netWorth) * 100 : 0;
                            return (
                                <div key={h.ticker}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300 font-bold">{h.ticker.replace('.NS', '')}</span>
                                        <span className="text-slate-500">{percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                        <div className="pt-4 mt-4 border-t border-slate-800">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Cash</span>
                                <span className="text-slate-500">{netWorth > 0 ? ((data.cash / netWorth) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${netWorth > 0 ? (data.cash / netWorth) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TradeForm = ({ onTrade }) => {
    const [ticker, setTicker] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');

    const handleSubmit = (action) => {
        if (!ticker || !qty || !price) return;
        onTrade(ticker, action, qty, price);
        setTicker(''); setQty(''); setPrice('');
    };

    return (
        <div className="flex gap-2 items-end">
            <input placeholder="Ticker" value={ticker} onChange={e => setTicker(e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white w-24" />
            <input placeholder="Qty" type="number" value={qty} onChange={e => setQty(e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white w-20" />
            <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white w-24" />

            <button onClick={() => handleSubmit('BUY')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold ml-auto">BUY</button>
            <button onClick={() => handleSubmit('SELL')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold">SELL</button>
        </div>
    )
}

export default PortfolioView;
