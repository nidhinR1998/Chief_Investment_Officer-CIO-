import re
import logging

logger = logging.getLogger(__name__)

class NLPService:
    
    COMMON_TICKERS = ["RELIANCE", "TATASTEEL", "INFY", "TCS", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT", "AXISBANK", "HINDUNILVR", "BAJFINANCE", "MARUTI", "KITEX", "PAYTM", "ZOMATO"]
    
    STOP_WORDS = {
        "SHOULD", "WOULD", "COULD", "THIS", "THAT", "WHAT", "WHEN", "WHERE", "WHICH", "WHO", "WHOM",
        "STOCK", "SHARE", "PRICE", "TODAY", "TOMORROW", "NOW", "BUY", "SELL", "HOLD", 
        "ANALYSIS", "ANALYSE", "THINK", "ABOUT", "FOR", "AND", "THE", "IS", "ARE", "WAS", "WERE",
        "HAVE", "HAS", "HAD", "BEEN", "BE", "DO", "DOES", "DID", "DONE", "GET", "GOT", "GOTTEN",
        "AT", "IN", "ON", "OF", "TO", "FROM", "WITH", "WITHOUT", "BY", "GOOD", "BAD", "TIME",
        "IT", "ITS", "IT'S", "I", "ME", "MY", "MINE", "YOU", "YOUR", "YOURS", "WE", "US", "OUR",
        "BUYED", "BOUGHT", "SOLD", "HOLDING", "STOKE", "STOCKS", "SHARES", "YESTERDAY"
    }

    @staticmethod
    def parse_query(query: str) -> dict:
        """
        Parses a natural language query to extract:
        - Ticker Symbol
        - Intent (BUY/SELL/ANALYSIS)
        """
        query_upper = query.upper()
        
        # 1. Intent Detection
        intent = "ANALYSIS"
        if "BUY" in query_upper: intent = "BUY"
        elif "SELL" in query_upper: intent = "SELL"
        elif "HOLD" in query_upper: intent = "HOLD"
        
        # 2. Ticker Extraction
        found_ticker = None
        
        # Strategy A: Check against known list (Priority)
        for t in NLPService.COMMON_TICKERS:
            # Check for exact word match
            if re.search(r'\b' + t + r'\b', query_upper):
                found_ticker = t
                break
                
        # Strategy B: Regex for potential ticker
        # Look for uppercase words 3-10 chars long
        if not found_ticker:
            # Clean non-alphanumeric (keep spaces)
            clean_query = re.sub(r'[^A-Z0-9\s]', '', query_upper)
            words = clean_query.split()
            
            logger.info(f"NLP Debug: Words to analyze: {words}")
            
            # Filter candidates
            candidates = []
            for w in words:
                if len(w) < 3:
                     logger.debug(f"NLP Debug: Skipping '{w}' (too short)")
                     continue
                     
                if w in NLPService.STOP_WORDS:
                     logger.debug(f"NLP Debug: Skipping '{w}' (STOP_WORD)")
                     continue
                
                # Heuristic: Tickers often have no vowels or are short, but Indian ones are often names (KITEX)
                # Just filtering stopwords is a huge step up.
                logger.info(f"NLP Debug: Found Candidate: '{w}'")
                candidates.append(w)
            
            # Taking the first valid candidate is risky if multiple exist, but better than nothing.
            if candidates:
                found_ticker = candidates[0]
                logger.info(f"NLP Debug: Selected best candidate: '{found_ticker}'")
        
        # Strategy C: If input is just one word
        if not found_ticker and len(query.split()) == 1:
             w = query.upper().strip()
             if w not in NLPService.STOP_WORDS:
                found_ticker = w
                logger.info(f"NLP Debug: Single word match: '{found_ticker}'")

        if found_ticker:
            # Normalize for NSE
            found_ticker = found_ticker.replace("STOKE", "") # Edge case cleanup
            if not found_ticker.endswith(".NS") and not found_ticker.endswith(".BO"):
                found_ticker += ".NS"
                
            return {
                "valid": True,
                "ticker": found_ticker,
                "intent": intent,
                "original_query": query,
                "user_context": NLPService._extract_context(query)
            }
            
        return {"valid": False, "error": "Could not identify a valid stock ticker."}

    @staticmethod
    def _extract_context(query: str) -> dict:
        """
        Extracts price and quantity context from query.
        Examples: 
        - "at 211.40" -> price: 211.40
        - "12 stoke" -> quantity: 12
        """
        context = {"price": 0.0, "quantity": 0}
        
        # Regex for Price: "at 211.40" or "at 211" or "@ 211"
        price_match = re.search(r'(?:at|@)\s?(\d+(?:\.\d{1,2})?)', query, re.IGNORECASE)
        if price_match:
            try:
                context["price"] = float(price_match.group(1))
                logger.info(f"NLP Debug: Found User Price: {context['price']}")
            except: pass
            
        # Regex for Quantity: "12 stocks" or "12 shares" or "12 stoke"
        # Look for number followed optionally by stock/share/stoke
        qty_match = re.search(r'(\d+)\s*(?:stock|share|stoke|qt|quantity)', query, re.IGNORECASE)
        if qty_match:
             try:
                 context["quantity"] = int(qty_match.group(1))
                 logger.info(f"NLP Debug: Found User Quantity: {context['quantity']}")
             except: pass
             
        return context

nlp_service = NLPService()
