import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getPortfolio, executeTrade } from '../services/api';

const PortfolioView = () => {
    const [data, setData] = useState({ cash: 0, holdings: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const result = await getPortfolio();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const holdings = data.holdings || [];
    const totalInvested = holdings.reduce((acc, h) => acc + h.invested_value, 0);
    const currentValue = holdings.reduce((acc, h) => acc + (h.quantity * h.current_price), 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const netWorth = data.cash + currentValue;

    return (
        <div className="w-full min-h-full bg-[#f6f6f6]">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
                {/* Page Header */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">My Portfolio</h1>
                    <p className="text-gray-600">Track your investments and performance</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white border border-gray-300 rounded shadow-sm p-6">
                        <div className="text-sm text-gray-600 mb-1">Net Worth</div>
                        <div className="text-3xl font-bold text-slate-900">
                            ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-300 rounded shadow-sm p-6">
                        <div className="text-sm text-gray-600 mb-1">Cash Balance</div>
                        <div className="text-3xl font-bold text-slate-900">
                            ${data.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-300 rounded shadow-sm p-6">
                        <div className="text-sm text-gray-600 mb-1">Total P&L</div>
                        <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-[#00b652]' : 'text-[#ff333a]'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-lg ml-2">({pnlPercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                </div>

                {/* Holdings Table */}
                <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-slate-900">Holdings</h2>
                    </div>
                    {holdings.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-lg">No holdings yet. Start building your portfolio!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-slate-700">Symbol</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Quantity</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Avg Price</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Current Price</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">Market Value</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">P&L</th>
                                        <th className="text-right p-4 font-semibold text-slate-700">P&L %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map((h, idx) => {
                                        const pnl = (h.quantity * h.current_price) - (h.quantity * h.average_price);
                                        const pnlPct = ((h.current_price - h.average_price) / h.average_price) * 100;
                                        const isPositive = pnl >= 0;

                                        return (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-4 font-bold text-[#7e1fff]">{h.ticker}</td>
                                                <td className="p-4 text-right text-slate-900">{h.quantity}</td>
                                                <td className="p-4 text-right text-slate-900">${h.average_price.toFixed(2)}</td>
                                                <td className="p-4 text-right font-semibold text-slate-900">${h.current_price.toFixed(2)}</td>
                                                <td className="p-4 text-right font-bold text-slate-900">${(h.quantity * h.current_price).toFixed(2)}</td>
                                                <td className={`p-4 text-right font-semibold ${isPositive ? 'text-[#00b652]' : 'text-[#ff333a]'}`}>
                                                    {isPositive ? '+' : ''}${pnl.toFixed(2)}
                                                </td>
                                                <td className={`p-4 text-right font-semibold ${isPositive ? 'text-[#00b652]' : 'text-[#ff333a]'}`}>
                                                    {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortfolioView;
