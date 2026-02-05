import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Plus, ArrowUp, ArrowDown, CheckCircle, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { getStockAnalysis, startMonitoring } from '../services/api';

const AlertsView = () => {
    const [alerts, setAlerts] = useState([]);
    const [newAlert, setNewAlert] = useState({ ticker: '', target_price: '', condition: 'ABOVE' });
    const [currentPrice, setCurrentPrice] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    useEffect(() => {
        fetchAlerts();
        // Setup WS listener for alerts? 
        // Ideally App.jsx handles global toasts, but we can listen locally for list updates
    }, []);

    // Auto-fetch price when ticker changes
    useEffect(() => {
        const fetchPrice = async () => {
            if (newAlert.ticker.length < 3) {
                setCurrentPrice(null);
                return;
            }
            // Debounce could be good, but simple timeout for now
            const timeoutId = setTimeout(async () => {
                setLoadingPrice(true);
                try {
                    const data = await getStockAnalysis(newAlert.ticker);
                    if (data && data.price) {
                        setCurrentPrice(data.price);
                        // Auto-fill target price if empty
                        if (!newAlert.target_price) {
                            setNewAlert(prev => ({ ...prev, target_price: data.price }));
                        }
                    }
                } catch (e) {
                    // Silent fail
                } finally {
                    setLoadingPrice(false);
                }
            }, 1000); // 1s delay
            return () => clearTimeout(timeoutId);
        };
        fetchPrice();
    }, [newAlert.ticker]);

    const fetchAlerts = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/alerts/');
            setAlerts(res.data);
        } catch (e) { console.error(e); }
    };

    const addAlert = async () => {
        if (!newAlert.ticker || !newAlert.target_price) return;
        try {
            await axios.post('http://localhost:8000/api/v1/alerts/', {
                id: 0,
                ticker: newAlert.ticker.toUpperCase(),
                target_price: parseFloat(newAlert.target_price),
                condition: newAlert.condition,
                active: true
            });
            // Start monitoring if not already
            startMonitoring(newAlert.ticker).catch(e => console.error(e));

            fetchAlerts();
            setNewAlert({ ticker: '', target_price: '', condition: 'ABOVE' });
            setCurrentPrice(null);
        } catch (e) {
            console.error(e);
        }
    };

    const deleteAlert = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/v1/alerts/${id}`);
            fetchAlerts();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Price Alerts</h2>
                    <p className="text-slate-400">Real-time notifications for price movements</p>
                </div>
                <button onClick={fetchAlerts} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400">
                    <RefreshCcw size={16} />
                </button>
            </header>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Bell size={120} /></div>

                <h3 className="font-bold text-white mb-4 z-10 relative">Create New Alert</h3>
                <div className="flex gap-4 items-end z-10 relative">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 font-bold uppercase">Ticker</label>
                        <input
                            value={newAlert.ticker}
                            onChange={e => setNewAlert({ ...newAlert, ticker: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase focus:border-cyan-500 outline-none"
                            placeholder="RELIANCE"
                        />
                        {loadingPrice && <div className="text-[10px] text-cyan-500 mt-1 animate-pulse">Fetching current price...</div>}
                        {currentPrice && !loadingPrice && <div className="text-[10px] text-green-500 mt-1">LTP: ₹{currentPrice}</div>}
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase">Condition</label>
                        <select
                            value={newAlert.condition}
                            onChange={e => setNewAlert({ ...newAlert, condition: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none cursor-pointer"
                        >
                            <option value="ABOVE">Goes Above</option>
                            <option value="BELOW">Goes Below</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 font-bold uppercase">Target Price</label>
                        <input
                            type="number"
                            value={newAlert.target_price}
                            onChange={e => setNewAlert({ ...newAlert, target_price: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono outline-none focus:border-cyan-500"
                            placeholder="0.00"
                        />
                    </div>
                    <button onClick={addAlert} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold h-[42px] flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all active:scale-95">
                        <Plus size={16} /> Set Alert
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic">No active alerts set</div>
                ) : (
                    alerts.slice().reverse().map(alert => (
                        <div key={alert.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${alert.triggered ? 'bg-slate-900/50 border-slate-800 opacity-75' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                            <div className="flex items-center gap-4">
                                {alert.triggered ? (
                                    <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center text-green-500 border border-green-900">
                                        <CheckCircle size={20} />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-yellow-500 border border-slate-700">
                                        <Bell size={20} />
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-lg">{alert.ticker.replace('.NS', '')}</span>
                                        {alert.triggered && <span className="text-[10px] bg-green-900 text-green-400 px-2 py-0.5 rounded font-bold uppercase">Triggered</span>}
                                    </div>
                                    <div className="text-sm text-slate-400 flex items-center gap-1">
                                        Condition:
                                        <span className={`font-bold flex items-center gap-1 ${alert.condition === 'ABOVE' ? 'text-green-400' : 'text-red-400'}`}>
                                            {alert.condition === 'ABOVE' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                            {alert.condition}
                                        </span>
                                        <span className="text-white font-mono font-bold">₹{alert.target_price}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteAlert(alert.id)} className="text-slate-600 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-full transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AlertsView;
