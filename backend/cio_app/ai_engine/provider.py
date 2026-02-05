from abc import ABC, abstractmethod

class AIProvider(ABC):
    """
    Abstract Base Class for AI Providers.
    Allows swapping between Local Models (HuggingFace) and APIs (OpenAI, Gemini).
    """
    
    @abstractmethod
    async def analyze_sentiment(self, text: list[str]) -> dict:
        """
        Analyzes sentiment of a list of text strings.
        Returns: { "sentiment": "POSITIVE"|"NEGATIVE"|"NEUTRAL", "score": float }
        """
        pass
    
    @abstractmethod
    async def get_trading_signal(self, context: dict) -> str:
        """
        Asks the LLM/Model for a trading decision based on provided context.
        """
        pass
