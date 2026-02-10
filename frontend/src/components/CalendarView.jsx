import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, TrendingUp, DollarSign, GitBranch } from 'lucide-react';
import axios from 'axios';

const CalendarView = () => {
    const [activeTab, setActiveTab] = useState('earnings');
    const [earnings, setEarnings] = useState([]);
    const [dividends, setDividends] = useState([]);
    const [splits, setSplits] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [activeTab]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            if (activeTab === 'earnings') {
                const res = await axios.get('http://localhost:8000/api/v1/events/earnings');
                setEarnings(res.data.events);
            } else if (activeTab === 'dividends') {
                const res = await axios.get('http://localhost:8000/api/v1/events/dividends');
                setDividends(res.data.events);
            } else if (activeTab === 'splits') {
                const res = await axios.get('http://localhost:8000/api/v1/events/splits');
                setSplits(res.data.events);
            }
        } catch (err) {
            console.error('Failed to fetch calendar events:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderEarnings = () => (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left p-4 font-semibold text-slate-700">Date</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Symbol</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Company</th>
                        <th className="text-right p-4 font-semibold text-slate-700">Est. EPS</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Sector</th>
                    </tr>
                </thead>
                <tbody>
                    {earnings.map((event, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-4 text-slate-900">{event.date}</td>
                            <td className="p-4 font-bold text-[#7e1fff]">{event.ticker}</td>
                            <td className="p-4 text-slate-900">{event.company}</td>
                            <td className="p-4 text-right text-slate-900">
                                {event.estimatedEPS ? `₹${event.estimatedEPS.toFixed(2)}` : 'N/A'}
                            </td>
                            <td className="p-4 text-slate-700">{event.sector}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderDividends = () => (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left p-4 font-semibold text-slate-700">Ex-Date</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Symbol</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Company</th>
                        <th className="text-right p-4 font-semibold text-slate-700">Dividend</th>
                        <th className="text-right p-4 font-semibold text-slate-700">Yield</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Sector</th>
                    </tr>
                </thead>
                <tbody>
                    {dividends.map((event, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-4 text-slate-900">{event.exDate}</td>
                            <td className="p-4 font-bold text-[#7e1fff]">{event.ticker}</td>
                            <td className="p-4 text-slate-900">{event.company}</td>
                            <td className="p-4 text-right font-semibold text-[#00b652]">
                                ₹{event.dividendAmount.toFixed(2)}
                            </td>
                            <td className="p-4 text-right text-slate-900">
                                {event.dividendYield.toFixed(2)}%
                            </td>
                            <td className="p-4 text-slate-700">{event.sector}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderSplits = () => (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left p-4 font-semibold text-slate-700">Date</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Symbol</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Company</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Ratio</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Type</th>
                    </tr>
                </thead>
                <tbody>
                    {splits.map((event, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-4 text-slate-900">{event.date}</td>
                            <td className="p-4 font-bold text-[#7e1fff]">{event.ticker}</td>
                            <td className="p-4 text-slate-900">{event.company}</td>
                            <td className="p-4 text-center font-semibold text-slate-900">{event.ratio}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${event.type === 'Forward' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {event.type}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="w-full min-h-full bg-[#f6f6f6]">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
                {/* Page Header */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Market Calendar</h1>
                    <p className="text-gray-600">Track upcoming earnings, dividends, and corporate events</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('earnings')}
                            className={`flex-1 py-4 px-6 font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'earnings'
                                    ? 'border-b-2 border-[#7e1fff] text-[#7e1fff] bg-purple-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <TrendingUp size={20} />
                            Earnings
                        </button>
                        <button
                            onClick={() => setActiveTab('dividends')}
                            className={`flex-1 py-4 px-6 font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'dividends'
                                    ? 'border-b-2 border-[#7e1fff] text-[#7e1fff] bg-purple-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <DollarSign size={20} />
                            Dividends
                        </button>
                        <button
                            onClick={() => setActiveTab('splits')}
                            className={`flex-1 py-4 px-6 font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'splits'
                                    ? 'border-b-2 border-[#7e1fff] text-[#7e1fff] bg-purple-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <GitBranch size={20} />
                            Stock Splits
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'earnings' && (earnings.length === 0 ? (
                                    <div className="text-center p-12 text-gray-500">
                                        <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p>No upcoming earnings announcements in the next 30 days</p>
                                    </div>
                                ) : renderEarnings())}

                                {activeTab === 'dividends' && (dividends.length === 0 ? (
                                    <div className="text-center p-12 text-gray-500">
                                        <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p>No upcoming dividend payments in the next 90 days</p>
                                    </div>
                                ) : renderDividends())}

                                {activeTab === 'splits' && (splits.length === 0 ? (
                                    <div className="text-center p-12 text-gray-500">
                                        <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p>No recent or upcoming stock splits</p>
                                    </div>
                                ) : renderSplits())}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
