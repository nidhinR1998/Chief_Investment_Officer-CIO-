from cio_app.ai_engine.provider import AIProvider
from cio_app.ai_engine.model_selector import model_selector
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import logging

logger = logging.getLogger(__name__)

class LocalProvider(AIProvider):
    def __init__(self):
        self.model_name, self.size = model_selector.select_sentiment_model()
        logger.info(f"Initializing Local AI Provider with {self.model_name} ({self.size})")
        
        try:
            # Initialize Sentiment Pipeline
            # Temporarily disabled due to Torch/Pickle security vulnerability (CVE-2025-32434)
            # self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            # self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            # self.sentiment_pipeline = pipeline("sentiment-analysis", model=self.model, tokenizer=self.tokenizer)
            logger.warning("Local AI Model disabled for security/stability.")
            self.sentiment_pipeline = None
        except Exception as e:
            logger.error(f"Failed to load local AI model: {e}")
            self.sentiment_pipeline = None

    async def analyze_sentiment(self, texts: list[str]) -> dict:
        if not self.sentiment_pipeline or not texts:
            return {"sentiment": "NEUTRAL", "score": 0.0}

        try:
            # Batch processing could be done here, simple loop for now
            # Truncate texts to max length usually 512 for BERT
            truncated_texts = [t[:512] for t in texts]
            results = self.sentiment_pipeline(truncated_texts)
            
            # Aggregate results
            # FinBERT labels: positive, negative, neutral
            score_map = {"positive": 1, "neutral": 0, "negative": -1}
            total_score = 0
            
            for res in results:
                label = res['label'].lower()
                confidence = res['score']
                val = score_map.get(label, 0)
                total_score += (val * confidence)
            
            avg_score = total_score / len(results) if results else 0
            
            final_label = "NEUTRAL"
            if avg_score > 0.2: final_label = "POSITIVE"
            elif avg_score < -0.2: final_label = "NEGATIVE"
            
            return {"sentiment": final_label, "score": float(avg_score)}
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return {"sentiment": "ERROR", "score": 0.0}

    async def get_trading_signal(self, context: dict) -> str:
        # If using a Generative Model (Big), we could prompt it.
        # Since we likely rely on FinBERT (Classifier), we can't "ask" it for a signal directly via text gen.
        # So we use a logic layer here for Small models.
        
        sentiment_score = context.get("sentiment_score", 0)
        technicals = context.get("technical_signal", "HOLD")
        
        # Simple weighted logic
        # If Technical says BUY and Sentiment is POSITIVE -> STRONG BUY
        
        score = 0
        if technicals == "BUY": score += 2
        elif technicals == "SELL": score -= 2
        
        if sentiment_score > 0.5: score += 1
        elif sentiment_score < -0.5: score -= 1
        
        if score >= 2: return "BUY"
        if score <= -2: return "SELL"
        return "HOLD"

# Singleton instance
local_provider = LocalProvider()
