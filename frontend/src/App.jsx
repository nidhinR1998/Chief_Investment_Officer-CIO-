import React, { useState } from 'react';
import StockWindow from './components/StockWindow';
import PortfolioView from './components/PortfolioView';
import NewsView from './components/NewsView';
import AlertsView from './components/AlertsView';
import SettingsView from './components/SettingsView';
import { Search, LayoutDashboard, PieChart, Newspaper, Settings, Bell, Plus } from 'lucide-react';
import { parseSearchQuery, getPortfolio } from './services/api';

function App() {
    const [stocks, setStocks] = useState([]); // Array of objects { ticker, context }
    const [portfolioTickers, setPortfolioTickers] = useState([]); // Keep track to visually distinguish
    const [input, setInput] = useState('');
    const [activeView, setActiveView] = useState('dashboard'); // dashboard, portfolio, news, alerts, settings

    // Load Portfolio on startup
    React.useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const data = await getPortfolio();
                if (data && data.holdings) {
                    // Normalize: remove .NS for frontend consistency
                    const tickers = data.holdings.map(h => h.ticker.replace('.NS', '').replace('.BO', ''));
                    setPortfolioTickers(tickers);
                    setStocks(prev => {
                        // Merge unique, priority to portfolio
                        // prev is array of objects, tickers is array of strings.
                        const existingTickers = new Set(prev.map(s => s.ticker));
                        const newStocks = tickers
                            .filter(t => !existingTickers.has(t))
                            .map(t => ({ ticker: t, context: {} }));
                        return [...prev, ...newStocks];
                    });
                }
            } catch (e) {
                console.error("Failed to load portfolio:", e);
            }
        };
        loadPortfolio();
    }, []);

    const addStock = (tickerOrObj) => {
        if (!tickerOrObj) return;

        let newStockObj;
        if (typeof tickerOrObj === 'string') {
            newStockObj = { ticker: tickerOrObj.toUpperCase(), context: {} };
        } else {
            newStockObj = {
                ticker: tickerOrObj.ticker.toUpperCase(),
                context: tickerOrObj.context || {}
            };
        }

        if (stocks.some(s => s.ticker === newStockObj.ticker)) return;

        setStocks([...stocks, newStockObj]);
        setInput('');
        setActiveView('dashboard'); // Switch back to dashboard on search
    };

    const removeStock = (ticker) => {
        // Allow removing from view, but if it's in portfolio maybe warn? 
        // For now just remove from view.
        setStocks(stocks.filter(s => s.ticker !== ticker));
    };

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter') {
            const val = input.trim();
            if (!val) return;

            if (val.toLowerCase() === 'close') {
                setStocks([]);
                setInput('');
                return;
            }

            // Check if it's a simple ticker (no spaces, < 20 chars)
            if (!val.includes(' ') && val.length < 20) {
                addStock(val);
                return;
            }

            // Otherwise, treat as NLP Query
            try {
                // Show analyzing state if needed, or just await
                const result = await parseSearchQuery(val);
                if (result.valid && result.ticker) {
                    // Start in AI Mode if intent is question? (Future Feat)
                    addStock({
                        ticker: result.ticker.replace('.NS', ''),
                        context: result.user_context || {}
                    });
                } else {
                    alert("Could not identify stock. Please try typing just the symbol (e.g. TATASTEEL)");
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on view change
    const updateView = (v) => {
        setActiveView(v);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="flex w-full h-full bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div>
                    <div className="h-16 flex items-center px-6 border-b border-slate-800 justify-between">
                        <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
                            <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center text-white">C</div>
                            <span className="hidden md:inline">CIO Terminal</span>
                            <span className="md:hidden">CIO</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400">
                            <LayoutDashboard size={20} className="rotate-45" /> {/* Close Icon substitute or use X */}
                        </button>
                    </div>

                    <nav className="p-4 space-y-2">
                        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => updateView('dashboard')} />
                        <NavItem icon={<PieChart size={20} />} label="Portfolio" active={activeView === 'portfolio'} onClick={() => updateView('portfolio')} />
                        <NavItem icon={<Newspaper size={20} />} label="Market News" active={activeView === 'news'} onClick={() => updateView('news')} />
                        <NavItem icon={<Bell size={20} />} label="Alerts" active={activeView === 'alerts'} onClick={() => updateView('alerts')} />
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <NavItem icon={<Settings size={20} />} label="Settings" active={activeView === 'settings'} onClick={() => updateView('settings')} />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">

                {/* Header */}
                <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex items-center px-4 lg:px-6 justify-between shrink-0 gap-4">

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden text-slate-400 p-1 hover:text-white"
                    >
                        <LayoutDashboard size={24} />
                    </button>

                    <div className="flex-1 flex items-center bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700 max-w-xl">
                        <Search size={18} className="text-slate-400 mr-3 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search Symbol..."
                            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="hidden sm:flex text-[10px] text-slate-500 border border-slate-600 px-1.5 rounded shrink-0 ml-2">ENTER</div>
                    </div>

                    <div className="flex items-center gap-3 ml-2 shrink-0">
                        <span className="hidden md:inline text-xs font-mono text-slate-400">STATUS: <span className="text-green-500">LIVE</span></span>
                        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">AI</div>
                    </div>
                </header>

                {/* Workspace Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-700 relative">

                    {activeView === 'dashboard' && (
                        stocks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                                    <Plus size={32} />
                                </div>
                                <p className="text-lg">Add a stock to start analysis</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {stocks.map(stockObj => (
                                    <StockWindow
                                        key={stockObj.ticker}
                                        ticker={stockObj.ticker}
                                        context={stockObj.context}
                                        onClose={removeStock}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {activeView === 'portfolio' && <PortfolioView />}
                    {activeView === 'news' && <NewsView />}
                    {activeView === 'alerts' && <AlertsView />}
                    {activeView === 'settings' && <SettingsView />}

                </main>
            </div>
        </div>
    );
}

const NavItem = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'}`}
    >
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </div>
);

export default App;
