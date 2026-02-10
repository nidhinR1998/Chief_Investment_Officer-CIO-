import React from 'react';
import { Search, Menu, Bell, User } from 'lucide-react'

    ;

const Navbar = ({ onSearch, searchValue, setSearchValue, toggleSidebar, setActiveView }) => {
    return (
        <nav className="h-14 bg-[#7e1fff] text-white flex items-center px-4 lg:px-8 justify-between shadow-sm shrink-0 z-50">

            <div className="flex items-center gap-6">
                <button onClick={toggleSidebar} className="lg:hidden p-1 text-white/80 hover:text-white">
                    <Menu size={24} />
                </button>
                <div onClick={() => setActiveView && setActiveView('home')} className="flex items-center gap-2 font-bold text-2xl tracking-tight cursor-pointer">
                    <span className="text-white">Chief Investment Officer</span>
                    <span className="text-white font-normal">(CIO)</span>
                </div>

                <div className="hidden lg:flex items-center gap-6 ml-4 text-sm font-semibold text-white/95">
                    <button onClick={() => setActiveView && setActiveView('home')} className="hover:text-white transition-colors">Home</button>
                    <button onClick={() => setActiveView && setActiveView('dashboard')} className="hover:text-white transition-colors">Watchlists</button>
                    <button onClick={() => setActiveView && setActiveView('portfolio')} className="hover:text-white transition-colors">My Portfolio</button>
                    <button onClick={() => setActiveView && setActiveView('news')} className="hover:text-white transition-colors">Markets</button>
                    <button onClick={() => setActiveView && setActiveView('news')} className="hover:text-white transition-colors">News</button>
                </div>
            </div>

            <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border-none rounded-full leading-5 bg-white text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm font-normal"
                        placeholder="Search for news, symbols or companies"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={onSearch}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="hidden lg:flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-sm font-medium transition-colors">
                    <Bell size={16} />
                    Alerts
                </button>
                <button className="hidden lg:flex items-center gap-1 text-sm font-semibold hover:underline">
                    Sign in
                </button>
                <button className="hidden lg:block text-xs font-medium text-white/80 hover:text-white">
                    <User size={20} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
