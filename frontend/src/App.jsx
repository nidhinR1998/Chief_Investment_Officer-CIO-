import React, { useState } from 'react';
import StockWindow from './components/StockWindow';
import PortfolioView from './components/PortfolioView';
import NewsView from './components/NewsView';
import AlertsView from './components/AlertsView';
import SettingsView from './components/SettingsView';
import Navbar from './components/Navbar';
import MarketMarquee from './components/MarketMarquee';
import HomeView from './components/HomeView';
import StockDetailPage from './components/StockDetailPage';
import MarketDataView from './components/MarketDataView';
import ScreenerView from './components/ScreenerView';
import TechnicalView from './components/TechnicalView';
import CalendarView from './components/CalendarView';
import { parseSearchQuery, getPortfolio } from './services/api';
import { Plus } from 'lucide-react';

function App() {
    const [stocks, setStocks] = useState([]); // Array of objects { ticker, context }
    const [portfolioTickers, setPortfolioTickers] = useState([]);
    const [activeView, setActiveView] = useState('home'); // home, dashboard, portfolio, news, alerts, settings
    const [searchValue, setSearchValue] = useState('');
    const [selectedStock, setSelectedStock] = useState(null); // For detail page

    // Load Portfolio on startup
    React.useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const data = await getPortfolio();
                if (data && data.holdings) {
                    const tickers = data.holdings.map(h => h.ticker.replace('.NS', '').replace('.BO', ''));
                    setPortfolioTickers(tickers);
                    setStocks(prev => {
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

        if (stocks.some(s => s.ticker === newStockObj.ticker)) {
            // If already exists, just switch to dashboard to show it?
            // Or maybe open a detailed view (Future). For now, switch to dashboard.
            setActiveView('dashboard');
            return;
        }

        setStocks([...stocks, newStockObj]);
        setSearchValue('');
        setActiveView('dashboard'); // Switch to dashboard on search/add
    };

    const removeStock = (ticker) => {
        setStocks(stocks.filter(s => s.ticker !== ticker));
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter') {
            const val = searchValue.trim();
            if (!val) return;

            if (val.toLowerCase() === 'close') {
                setStocks([]);
                setSearchValue('');
                return;
            }



            try {
                const result = await parseSearchQuery(val);
                if (result.valid && result.ticker) {
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

    const handleStockClick = (ticker) => {
        // Check if this is a market data category (e.g., MARKET:currencies)
        if (ticker.startsWith('MARKET:')) {
            const category = ticker.split(':')[1];
            setActiveView('marketdata');
            setSelectedStock(category); // Store the category in selectedStock
            return;
        }

        // Check if this is a research tool
        const researchTools = ['screener', 'technical', 'calendar'];
        if (researchTools.includes(ticker.toLowerCase())) {
            setActiveView(ticker.toLowerCase());
            setSelectedStock(null);
            return;
        }

        // Regular stock - clean ticker symbol (remove exchange suffixes)
        const cleanTicker = ticker.replace('^', '').replace('.NS', '').replace('.BO', '');
        setSelectedStock(cleanTicker);
    };

    const closeStockDetail = () => {
        setSelectedStock(null);
        setActiveView('home');
    };

    // Mobile Sidebar Toggle (For the new Navbar menu button if needed)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">

            {/* Stock Detail Page Modal - Only show for actual stocks, not market categories */}
            {selectedStock && activeView !== 'marketdata' && (
                <StockDetailPage ticker={selectedStock} onClose={closeStockDetail} />
            )}

            {/* Global Navbar */}
            <Navbar
                onSearch={handleSearch}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                setActiveView={setActiveView}
            />

            {/* Market Ticker Strip */}
            <MarketMarquee />

            {/* Main Content Area */}
            <main className="flex-1 w-full bg-gray-50 overflow-y-auto">

                {activeView === 'home' && <HomeView onStockClick={handleStockClick} />}

                {activeView === 'marketdata' && selectedStock && (
                    <MarketDataView
                        category={selectedStock}
                        onBack={closeStockDetail}
                    />
                )}

                {activeView === 'dashboard' && (
                    <div className="p-4">
                        {stocks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                    <Plus size={32} />
                                </div>
                                <p>Search for a ticker (e.g. "RELIANCE") to add to your dashboard.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                                {stocks.map(stockObj => (
                                    <StockWindow
                                        key={stockObj.ticker}
                                        ticker={stockObj.ticker}
                                        context={stockObj.context}
                                        onClose={removeStock}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeView === 'portfolio' && <PortfolioView />}
                {activeView === 'news' && <NewsView />}
                {activeView === 'alerts' && <AlertsView />}
                {activeView === 'settings' && <SettingsView />}
                {activeView === 'screener' && <ScreenerView />}
                {activeView === 'technical' && <TechnicalView />}
                {activeView === 'calendar' && <CalendarView />}
            </main>

            {/* Stock Detail Page - Renders on top when a stock is selected */}
            {selectedStock && activeView === 'home' && (
                <StockDetailPage ticker={selectedStock} onClose={closeStockDetail} />
            )}

        </div>
    );
}

export default App;
