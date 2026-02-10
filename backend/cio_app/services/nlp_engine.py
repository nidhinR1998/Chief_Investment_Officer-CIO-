import re
import requests
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

    # Mapping for Merged/Renamed/Common Aliases
    ALIAS_MAP = {
        "HDFC": "HDFCBANK",
        "HDFC BANK": "HDFCBANK",
        "RELIANCE INDUSTRIES": "RELIANCE",
        "TATA MOTORS": "TATAMOTORS",
        "TATA STEEL": "TATASTEEL",
        "INFOSYS": "INFY",
        "AIRTEL": "BHARTIARTL",
        "HINDUSTAN UNILEVER": "HINDUNILVR",
        "BAJAJ FINANCE": "BAJFINANCE",
        "MARUTI SUZUKI": "MARUTI",
        "L&T": "LT",
        "LARSEN": "LT",
        "KOTAK": "KOTAKBANK",
        "ICICI": "ICICIBANK",
        "AXIS": "AXISBANK",
        "SBI": "SBIN"
    }

    @staticmethod
    def _resolve_alias(ticker: str) -> str:
        """
        Resolves common aliases to official NSE tickers.
        """
        if not ticker: return ticker
        ticker_upper = ticker.upper().replace(".NS", "").replace(".BO", "")
        
        # 1. Direct Alias Lookup
        if ticker_upper in NLPService.ALIAS_MAP:
            return NLPService.ALIAS_MAP[ticker_upper]
            
        # 2. Fuzzy/Partial Logic can go here if needed
        return ticker_upper

    @staticmethod
    def _online_search(query: str) -> str:
        """
        Fallback: Search Yahoo Finance Autocomplete for symbol.
        """
        try:
            logger.info(f"NLP: Performing online search for '{query}'")
            url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=5&newsCount=0"
            headers = {'User-Agent': 'Mozilla/5.0'}
            resp = requests.get(url, headers=headers, timeout=5)
            data = resp.json()
            
            if 'quotes' in data and data['quotes']:
                # Priority 1: Indian NSE/BSE stocks
                for q in data['quotes']:
                    symbol = q.get('symbol', '')
                    if symbol.endswith('.NS') or symbol.endswith('.BO'):
                        logger.info(f"NLP: Found online match (India): {symbol}")
                        return symbol
                
                # Priority 2: Exact match on name
                for q in data['quotes']:
                    if query.upper() in q.get('shortname', '').upper() or query.upper() in q.get('longname', '').upper():
                         return q.get('symbol')

                # Priority 3: First result
                first = data['quotes'][0]['symbol']
                logger.info(f"NLP: Found online match (Global): {first}")
                return first
                
        except Exception as e:
            logger.error(f"Online search failed: {e}")
        return None

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

        # Strategy A.5: Check ALIAS MAP keys (Multi-word support)
        # e.g. "TATA MOTORS" -> "TATAMOTORS"
        if not found_ticker:
            for alias, target in NLPService.ALIAS_MAP.items():
                # Check if alias phrase exists in query
                if re.search(r'\b' + re.escape(alias) + r'\b', query_upper):
                    found_ticker = target
                    logger.info(f"NLP Debug: Found Multi-word Alias: '{alias}' -> '{target}'")
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
                
                # Check ALIAS MAP first as a candidate source (Single word)
                if w in NLPService.ALIAS_MAP:
                    candidates.append(NLPService.ALIAS_MAP[w])
                    continue

                # Heuristic: Tickers often have no vowels or are short, but Indian ones are often names (KITEX)
                # Just filtering stopwords is a huge step up.
                logger.info(f"NLP Debug: Found Candidate: '{w}'")
                candidates.append(w)
            
            # Taking the first valid candidate is risky if multiple exist, but better than nothing.
            if candidates:
                # If we found a candidate locally, but it's very short (3-4 chars) 
                # AND it wasn't in our COMMON_TICKERS list, it might be a false positive (e.g. "COAL").
                # Let's try online search for the FULL query to be sure, if we have words left over.
                if len(candidates[0]) <= 4 and len(words) > 1:
                     logger.info(f"NLP Debug: Candidate '{candidates[0]}' is weak. Trying online search for full query.")
                     online_result = NLPService._online_search(clean_query)
                     if online_result:
                         found_ticker = online_result
                     else:
                         found_ticker = candidates[0]
                else:
                    found_ticker = candidates[0]
                
                logger.info(f"NLP Debug: Selected best candidate: '{found_ticker}'")
        
        # Strategy C: If input is just one word
        if not found_ticker and len(query.split()) == 1:
             w = query.upper().strip()
             if w not in NLPService.STOP_WORDS:
                found_ticker = w
                logger.info(f"NLP Debug: Single word match: '{found_ticker}'")

        # Strategy D: Online Fallback (The "Optimization")
        # If explicitly no ticker found OR if we want to confirm
        if not found_ticker:
             # Try searching the full query if it looks like a name
             # Remove common verbs/stopwords effectively by using the cleaned query
             clean_query_search = re.sub(r'[^A-Z0-9\s]', '', query_upper).strip()
             if len(clean_query_search) > 2:
                 found_ticker = NLPService._online_search(clean_query_search)

        if found_ticker:
            # Resolve Alias (e.g. HDFC -> HDFCBANK)
            found_ticker = NLPService._resolve_alias(found_ticker)
            
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
