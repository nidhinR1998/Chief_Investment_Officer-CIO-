import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import axios from 'axios';

const NewsView = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNews = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/news/global');
            setNews(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Market Intelligence</h2>
                    <p className="text-slate-400">Top stories moving the Indian Markets (Sensex, Nifty, Global)</p>
                </div>
                <button onClick={() => { setLoading(true); fetchNews(); }} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold text-cyan-400 border border-slate-700 transition-colors">
                    Refresh Feed
                </button>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-cyan-500 animate-pulse">
                    Loading Global News...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto pb-10">
                    {news.map((item, i) => (
                        <a key={i} href={item.link} target="_blank" rel="noreferrer" className="group bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-cyan-500 transition-colors flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">{item.media || 'Source'}</span>
                                <span className="text-xs text-slate-500">{item.date}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-200 group-hover:text-cyan-400 mb-2 leading-snug">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">
                                {item.desc}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 group-hover:text-white mt-auto">
                                Read Full Story <ExternalLink size={12} className="ml-1" />
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsView;
