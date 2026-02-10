import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const MarketMarquee = () => {
    const [indices, setIndices] = useState([]);

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                // Fetch from your backend
                const response = await fetch('http://localhost:8000/api/v1/market/summary');
                const data = await response.json();
                if (data && data.data) {
                    setIndices(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch market summary:", error);
                // Fallback mock data if fetch fails
                setIndices([
                    { name: 'NIFTY 50', price: '24,350.20', change: '+0.50%', isUp: true },
                    { name: 'SENSEX', price: '80,100.10', change: '+0.44%', isUp: true },
                    { name: 'BANK NIFTY', price: '52,400.00', change: '-0.10%', isUp: false },
                    { name: 'Dow 30', price: '37,545.33', change: '+0.35%', isUp: true },
                    { name: 'Nasdaq', price: '14,969.65', change: '+1.25%', isUp: true },
                ]);
            }
        };

        fetchMarketData();
        const refreshInterval = setInterval(fetchMarketData, 30000); // Refresh every 30s

        return () => clearInterval(refreshInterval);
    }, []);

    return (
        <div className="w-full bg-white border-b border-gray-200 overflow-hidden h-12 flex items-center">
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
            `}</style>
            <div className="animate-scroll whitespace-nowrap flex items-center gap-6 px-4">
                {[...indices, ...indices].map((idx, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-700 font-semibold">{idx.name}</span>
                        <span className="text-slate-900 font-bold">{idx.price}</span>
                        <span className={`flex items-center font-semibold ${idx.isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {idx.isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                            {idx.change}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketMarquee;
