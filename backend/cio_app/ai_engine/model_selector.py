import torch
import logging

logger = logging.getLogger(__name__)

class ModelSelector:
    
    @staticmethod
    def get_hardware_capabilities():
        """
        Returns a dict describing available hardware.
        """
        info = {
            "device": "cpu",
            "vram_gb": 0,
            "can_run_llm": False
        }
        
        if torch.cuda.is_available():
            info["device"] = "cuda"
            # Get VRAM of device 0 in GB
            properties = torch.cuda.get_device_properties(0)
            vram = properties.total_memory / (1024**3)
            info["vram_gb"] = round(vram, 2)
            
            if vram > 12:
                info["can_run_llm"] = True
                info["recommended_model"] = "BIG"
            elif vram > 6:
                info["can_run_llm"] = True
                info["recommended_model"] = "MEDIUM"
            else:
                info["recommended_model"] = "SMALL"
        else:
             info["recommended_model"] = "SMALL"
             
        logger.info(f"Hardware Detection: {info}")
        return info

    @staticmethod
    def select_sentiment_model():
        """
        Returns the Hugging Face model path based on hardware.
        """
        hw = ModelSelector.get_hardware_capabilities()
        model_type = hw.get("recommended_model", "SMALL")
        
        if model_type == "BIG":
            # Example: Large Financial LLM
            return "ProsusAI/finbert", "BIG" 
        elif model_type == "MEDIUM":
            # Example: Compressed/Distilled
            return "ProsusAI/finbert", "MEDIUM"
        else:
            # Default to FinBERT as it's efficient for pure sentiment
            return "ProsusAI/finbert", "SMALL"

model_selector = ModelSelector()
