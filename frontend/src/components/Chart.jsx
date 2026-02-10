import React, { useEffect, useRef, memo } from 'react';

const StockChart = ({ ticker }) => {
    const container = useRef();

    useEffect(() => {
        if (!ticker) return;

        // Clean up previous widget if exists
        if (container.current) {
            container.current.innerHTML = "";
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

        // Normalize ticker for TradingView
        // TradingView expects "EXCHANGE:SYMBOL" format usually
        // For NSE, it's often just "SYMBOL" if we specify exchange, or "NSE:SYMBOL"
        let symbol = ticker.replace('.NS', '').replace('.BO', '');

        // TradingView symbol format for Indian stocks
        const tvSymbol = `NSE:${symbol}`;

        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": tvSymbol,
            "interval": "D",
            "timezone": "Asia/Kolkata",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "allow_symbol_change": false,
            "calendar": false,
            "support_host": "https://www.tradingview.com"
        });

        container.current.appendChild(script);

    }, [ticker]);

    return (
        <div className="h-full w-full overflow-hidden rounded bg-slate-900 border border-slate-800" ref={container}>
            <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
            </div>
        </div>
    );
};

export default memo(StockChart);
