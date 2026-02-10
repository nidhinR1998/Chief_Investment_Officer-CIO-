from cio_app.services.market_data import market_data
from cio_app.services.technical_analysis import technical_analysis
from cio_app.services.news_agent import news_service
from cio_app.ai_engine.local_provider import local_provider
import logging
import asyncio

logger = logging.getLogger(__name__)

class DecisionEngine:
    
    async def analyze_ticker(self, ticker: str, include_fundamentals: bool = False, user_context: dict = None) -> dict:
        """
        Performs full analysis on a ticker.
        """
        logger.info(f"Starting analysis for {ticker} (Fundamentals: {include_fundamentals})")
        
        # 1. Fetch Data Parallelly
        # For simplicity in this step, doing sequential await or gathering
        # News and Market Data can be parallel
        
        try:
            # Market Data
            live_data = await market_data.get_live_price(ticker)
            if not live_data:
                return {"error": "Could not fetch market data"}

            fundamentals = {}
            if include_fundamentals:
                fundamentals = await market_data.get_fundamentals(ticker)
                
            # Fetch 1: Daily data for Technical Analysis (Robust)
            # 1 Year to ensure we have enough for SMA-200 if needed (SMA-50 requires ~2.5 months)
            ta_data_df = await market_data.get_stock_data(ticker, period="1y", interval="1d")
            
            # Fetch 2: Intraday data for UI Chart (Visual)
            # 1 Day of 5-minute candles
            chart_data_df = await market_data.get_stock_data(ticker, period="1d", interval="5m")
            
            # Prepare Chart History for Frontend
            chart_history = []
            if not chart_data_df.empty:
                # Reset index to get 'Datetime' column if it's the index
                chart_data_df = chart_data_df.reset_index()
                for _, row in chart_data_df.iterrows():
                    # Handle different column names (Datetime vs Date)
                    ts = row.get("Datetime") or row.get("Date")
                    if ts:
                        chart_history.append({
                            "time": ts.isoformat(),
                            "price": row["Close"]
                        })
            
            # News
            news_items = await asyncio.to_thread(news_service.get_news, ticker)
            
            # 2. Technical Analysis (Use Daily Data)
            ta_results = technical_analysis.analyze(ta_data_df)
            
            # --- EXPERT DECISION LOGIC (v2 - Strong Analysis) ---
            ta_score = 0
            reasoning = []
            
            # Key Levels
            current_price = live_data["price"]
            ema_200 = ta_results.get("EMA_200")
            ema_50 = ta_results.get("EMA_50")
            
            # 1. Trend Filter (The "No False Decisions" Rule)
            trend_bullish = False
            if ema_200 and current_price > ema_200:
                trend_bullish = True
                reasoning.append("Price is ABOVE 200 EMA (Long-term Uptrend)")
            elif ema_200:
                reasoning.append("Price is BELOW 200 EMA (Long-term Downtrend)")
                
            # 2. Golden Cross / Death Cross
            if ema_50 and ema_200:
                diff = ema_50 - ema_200
                if diff > 0 and (diff / ema_200) < 0.02: # Recent cross or close
                     reasoning.append("Golden Cross Active (Bullish)")
                     ta_score += 1
                elif diff < 0 and (abs(diff) / ema_200) < 0.02:
                     reasoning.append("Death Cross Active (Bearish)")
                     ta_score -= 2

            # 3. RSI Logic (with Trend Context)
            rsi = ta_results.get("RSI", 50)
            if rsi < 30: 
                if trend_bullish:
                    ta_score += 3 # Strong Buy (Dip in Uptrend)
                    reasoning.append("Oversold in Uptrend (Strong Buy)")
                else:
                    ta_score += 1 # Weak Buy (Counter-trend)
                    reasoning.append("Oversold but in Downtrend (Risky Buy)")
            elif rsi > 70: 
                ta_score -= 2
                reasoning.append("Overbought (Sell Signal)")
                
            # 4. MACD Logic
            macd_hist = ta_results.get("MACD_Hist", 0)
            if macd_hist > 0: 
                ta_score += 1
                reasoning.append("MACD Positive")
            else: 
                ta_score -= 1
            
            # 5. Stochastic (Confirmation)
            stoch_k = ta_results.get("Stoch_K", 50)
            if stoch_k < 20 and rsi < 40:
                ta_score += 1
                reasoning.append("Stochastic Confirmation (Oversold)")
                
            # 6. Pivot Analysis
            pivot = ta_results.get("Pivot", 0)
            r1 = ta_results.get("R1", 0)
            s1 = ta_results.get("S1", 0)
            
            if current_price > r1:
                reasoning.append("Broke Resistance R1")
                ta_score += 1
            elif current_price < s1:
                reasoning.append("Broke Support S1")
                ta_score -= 1
                
            # 7. Advanced Confluence (New Tools)
            # Parabolic SAR (Trend Direction)
            psar = ta_results.get("PSAR")
            if psar and current_price > psar:
                reasoning.append("Price above PSAR (Uptrend)")
                ta_score += 0.5
            elif psar:
                 ta_score -= 0.5
                 
            # KST (Know Sure Thing) - Long term momentum
            kst = ta_results.get("KST", 0)
            if kst > 0:
                ta_score += 0.5
            else:
                ta_score -= 0.5

            # --- CONTEXTUAL ADVICE (Profit/Loss Analysis) ---
            user_price = user_context.get("price", 0.0) if user_context else 0.0
            if user_price > 0:
                pnl_percent = ((current_price - user_price) / user_price) * 100
                is_profit = pnl_percent > 0
                
                reasoning.append(f"Your Entry: {user_price:.2f} (P&L: {pnl_percent:+.2f}%)")
                
                if is_profit:
                    if pnl_percent > 10:
                        reasoning.append("You are in STRONG PROFIT. Consider booking partial profit.")
                    elif pnl_percent > 20 and ta_score < 0:
                         reasoning.append("Protect your gains! Technicals are weakening.")
                    else:
                        reasoning.append("You are in profit. Hold with a trailing stop.")
                        
                else: 
                     # Loss Scenarios
                     if pnl_percent < -10:
                         # Deep loss
                         if trend_bullish:
                             reasoning.append("You are down 10% but trend is Bullish. Hold for recovery.")
                         else:
                             reasoning.append("CRITICAL: You are down >10% and Trend is Bearish. CONSIDER STOP LOSS.")
                     else:
                         reasoning.append("Small loss. Hold if you believe in the long-term story.")
            # ------------------------------------------------

            # Final Signal Calculation (Strict Rules)
            # If Downtrend (Below EMA 200), require very high score to buy
            if not trend_bullish and ta_score > 0:
                ta_score -= 1 # Penalize counter-trend
                
            if ta_score >= 3: ta_signal = "STRONG BUY"
            elif ta_score >= 1: ta_signal = "BUY"
            elif ta_score <= -3: ta_signal = "STRONG SELL"
            elif ta_score <= -1: ta_signal = "SELL"
            else: ta_signal = "HOLD"
            
            # 3. AI Sentiment Analysis
            news_titles = [n['title'] for n in news_items]
            sentiment_result = await local_provider.analyze_sentiment(news_titles)
            
            # 4. Final Decision Context
            context = {
                "sentiment_score": sentiment_result.get("score"),
                "technical_signal": ta_signal
            }
            final_signal = await local_provider.get_trading_signal(context)
            
            # 5. Advanced Risk Calculation
            # Max Drawdown (1 Year)
            max_drawdown = 0
            if not ta_data_df.empty:
                rolling_max = ta_data_df['Close'].cummax()
                drawdown = (ta_data_df['Close'] - rolling_max) / rolling_max
                max_drawdown = drawdown.min() * 100 # Percentage
            
            risk_level = "MEDIUM"
            if max_drawdown < -20: risk_level = "HIGH"
            elif max_drawdown > -10: risk_level = "LOW"
            
            analysis_summary = " ".join(reasoning)

            response = {
                "ticker": ticker,
                "timestamp": live_data["timestamp"],
                "price": live_data["price"],
                
                # New: Yahoo Finance-style structure for frontend
                "live_data": {
                    "price": live_data["price"],
                    "change": live_data.get("change", 0),
                    "changePct": live_data.get("changePct", 0)
                },
                
                "signal": final_signal,
                "confidence": abs(sentiment_result.get("score", 0)) * 100, 
                "risk": risk_level,
                "risk_metrics": {
                    "volatility": ta_results.get("ATR", 0),
                    "max_drawdown": max_drawdown
                },
                "fundamentals": fundamentals,
                
                # New: News in Yahoo Finance format
                "news_sentiment": {
                    "articles": [
                        {
                            "title": item.get("title", ""),
                            "source": item.get("media", "Unknown"),
                            "published": item.get("date", ""),
                            "link": item.get("link", "")
                        }
                        for item in (news_items[:5] if news_items else [])
                    ]
                },
                
                "history": chart_history, 
                "analysis": {
                    "technical": ta_results,
                    "sentiment": sentiment_result,
                    "reasoning": analysis_summary,
                    "reasoning_list": reasoning,
                    "news_summary": news_items[:5] 
                }
            }
            
            return response

        except Exception as e:
            logger.error(f"Critical error analyzing {ticker}: {e}")
            # Do not crash, return a valid structure with error flag for UI
            return {
                "ticker": ticker,
                "error": str(e),
                "signal": "ERROR",
                "price": 0,
                "confidence": 0,
                "risk": "HIGH",
                "analysis": {"reasoning": "Failed to analyze ticker. Please check symbol."}
            }

decision_engine = DecisionEngine()
