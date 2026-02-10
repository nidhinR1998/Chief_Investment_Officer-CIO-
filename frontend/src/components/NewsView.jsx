import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
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
        <div className="w-full min-h-full bg-[#f6f6f6]">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
                {/* Page Header */}
                <div className="bg-white rounded border border-gray-300 shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Market News</h1>
                            <p className="text-gray-600">Top stories moving the markets</p>
                        </div>
                        <button
                            onClick={() => { setLoading(true); fetchNews(); }}
                            className="px-4 py-2 bg-[#7e1fff] hover:bg-[#6a1ad9] text-white rounded font-semibold transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((item, i) => (
                            <a
                                key={i}
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="group bg-white border border-gray-300 rounded shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-semibold text-[#7e1fff] uppercase">{item.media || 'Source'}</span>
                                    <span className="text-xs text-gray-500">{item.date}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#7e1fff] mb-2 leading-snug transition-colors">
                                    {item.title}
                                </h3>
                                {item.summary && (
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                        {item.summary}
                                    </p>
                                )}
                                <div className="flex items-center text-[#7e1fff] text-sm font-semibold">
                                    Read More <ExternalLink size={14} className="ml-1" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsView;
