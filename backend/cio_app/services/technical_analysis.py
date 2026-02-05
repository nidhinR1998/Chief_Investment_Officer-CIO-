import pandas as pd
import ta
import logging

logger = logging.getLogger(__name__)

class TechnicalAnalysisService:

    @staticmethod
    def analyze(df: pd.DataFrame) -> dict:
        """
        Applies various technical indicators to the dataframe using 'ta' library.
        Returns the latest values for the decision engine.
        """
        if df.empty or len(df) < 26: # Need minimum data for MACD/RSI
            return {}

        # Ensure Close is clean
        close = df['Close']
        
        # 1. RSI (Relative Strength Index)
        # ta.momentum.RSIIndicator
        rsi_indicator = ta.momentum.RSIIndicator(close=close, window=14)
        df['RSI'] = rsi_indicator.rsi()
        
        # 2. MACD
        # ta.trend.MACD
        macd = ta.trend.MACD(close=close)
        df['MACD_Line'] = macd.macd()
        df['MACD_Signal'] = macd.macd_signal()
        df['MACD_Hist'] = macd.macd_diff()
        
        # 3. Bollinger Bands
        # ta.volatility.BollingerBands
        bb = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
        df['BBU_Upper'] = bb.bollinger_hband()
        df['BBL_Lower'] = bb.bollinger_lband()
        df['BBM_Mid'] = bb.bollinger_mavg()
        
        # 4. Moving Averages
        df['SMA_50'] = ta.trend.SMAIndicator(close=close, window=50).sma_indicator()
        df['EMA_20'] = ta.trend.EMAIndicator(close=close, window=20).ema_indicator()
        df['EMA_50'] = ta.trend.EMAIndicator(close=close, window=50).ema_indicator()
        df['EMA_200'] = ta.trend.EMAIndicator(close=close, window=200).ema_indicator()
        
        # 5. Advanced Indicators
        # Stochastic Oscillator
        stoch = ta.momentum.StochasticOscillator(high=df['High'], low=df['Low'], close=close, window=14, smooth_window=3)
        df['Stoch_K'] = stoch.stoch()
        df['Stoch_D'] = stoch.stoch_signal()
        
        # On-Balance Volume (OBV)
        if 'Volume' in df.columns:
            df['OBV'] = ta.volume.OnBalanceVolumeIndicator(close=close, volume=df['Volume']).on_balance_volume()
        else:
            df['OBV'] = 0

        # ADX: Trend Strength (>25 is strong trend)
        try:
            adx = ta.trend.ADXIndicator(high=df['High'], low=df['Low'], close=close, window=14)
            df['ADX'] = adx.adx()
        except:
             df['ADX'] = 0

        # ATR: Volatility
        try:
             atr = ta.volatility.AverageTrueRange(high=df['High'], low=df['Low'], close=close, window=14)
             df['ATR'] = atr.average_true_range()
        except:
             df['ATR'] = 0
             
        # 6. Pivot Points (Classic)
        # Pivot = (H + L + C) / 3
        # R1 = 2*P - L, S1 = 2*P - H
        df['Pivot'] = (df['High'] + df['Low'] + df['Close']) / 3
        df['R1'] = (2 * df['Pivot']) - df['Low']
        df['S1'] = (2 * df['Pivot']) - df['High']

        # 7. Additional User-Requested Indicators
        
        # Rate of Change (ROC)
        df['ROC'] = ta.momentum.ROCIndicator(close=close, window=12).roc()
        
        # Parabolic SAR
        df['PSAR'] = ta.trend.PSARIndicator(high=df['High'], low=df['Low'], close=close).psar()
        
        # Volume Price Trend (VPT)
        if 'Volume' in df.columns:
            df['VPT'] = ta.volume.VolumePriceTrendIndicator(close=close, volume=df['Volume']).volume_price_trend()
            
            # Ease of Movement (EOM)
            df['EOM'] = ta.volume.EaseOfMovementIndicator(high=df['High'], low=df['Low'], volume=df['Volume']).ease_of_movement()
        else:
            df['VPT'] = 0
            df['EOM'] = 0

        # Aroon Oscillator
        try:
             # Aroon uses High and Low
             # CORRECT SIGNATURE: class AroonIndicator(high, low, window=25, fillna=False)
             aroon = ta.trend.AroonIndicator(high=df['High'], low=df['Low'], window=25)
             df['Aroon_Up'] = aroon.aroon_up()
             df['Aroon_Down'] = aroon.aroon_down()
             df['Aroon_Ind'] = aroon.aroon_indicator()
        except Exception as e:
             logger.warning(f"Failed to calculate Aroon: {e}")
             df['Aroon_Up'] = 0
             df['Aroon_Down'] = 0
             df['Aroon_Ind'] = 0
        
        # Know Sure Thing (KST)
        df['KST'] = ta.trend.KSTIndicator(close=close).kst()
        
        # Stochastic RSI
        stoch_rsi = ta.momentum.StochRSIIndicator(close=close, window=14)
        df['Stoch_RSI_K'] = stoch_rsi.stochrsi_k()
        df['Stoch_RSI_D'] = stoch_rsi.stochrsi_d()
        
        # Heikin Ashi (Calculated values)
        # HA_Close = (Open + High + Low + Close) / 4
        # HA_Open = (Previous HA_Open + Previous HA_Close) / 2
        df['HA_Close'] = (df['Open'] + df['High'] + df['Low'] + df['Close']) / 4
        # Calculate HA_Open iteratively (slower in pandas without loop, but approximate for latest)
        # For simplicity in this real-time script, we'll approximations or just provide the Close
        # Standard pandas way requires shifting. 
        # Here we just provide HA_Close as the main indicator for trend smoothing
        
        # Get the latest row
        latest = df.iloc[-1]
        
        results = {
            "RSI": latest.get("RSI"),
            "MACD_Line": latest.get("MACD_Line"),
            "MACD_Signal": latest.get("MACD_Signal"),
            "MACD_Hist": latest.get("MACD_Hist"),
            "BBL_Lower": latest.get("BBL_Lower"),
            "BBM_Mid": latest.get("BBM_Mid"),
            "BBU_Upper": latest.get("BBU_Upper"),
            "SMA_50": latest.get("SMA_50"),
            "EMA_20": latest.get("EMA_20"),
            "EMA_50": latest.get("EMA_50"),
            "EMA_200": latest.get("EMA_200"),
            "Stoch_K": latest.get("Stoch_K"),
            "Stoch_D": latest.get("Stoch_D"),
            "OBV": latest.get("OBV"),
            "ADX": latest.get("ADX"),
            "ATR": latest.get("ATR"),
            "Pivot": latest.get("Pivot"),
            "R1": latest.get("R1"),
            "S1": latest.get("S1"),
            "ROC": latest.get("ROC"),
            "PSAR": latest.get("PSAR"),
            "VPT": latest.get("VPT"),
            "EOM": latest.get("EOM"),
            "Aroon_Ind": latest.get("Aroon_Ind"),
            "KST": latest.get("KST"),
            "Stoch_RSI_K": latest.get("Stoch_RSI_K"),
            "HA_Close": latest.get("HA_Close"),
            "Close": latest.get("Close")
        }
        
        # Handle NaN values (if not enough data for 50SMA etc)
        # Replace NaN with None or 0 for JSON safety
        results = {k: (None if pd.isna(v) else v) for k, v in results.items()}
        
        return results

    @staticmethod
    def generate_signal(indicators: dict) -> str:
        """
        Simple heuristic signal generator.
        """
        score = 0
        rsi = indicators.get("RSI")
        
        if rsi is not None:
            if rsi < 30: score += 1 # Oversold -> Buy
            if rsi > 70: score -= 1 # Overbought -> Sell
            
        if score > 0: return "BUY"
        if score < 0: return "SELL"
        return "HOLD"
        
technical_analysis = TechnicalAnalysisService()
