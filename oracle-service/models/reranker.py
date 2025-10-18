"""
Reranker Service
Cross-encoder for two-stage retrieval (reranking)
"""

from sentence_transformers import CrossEncoder
from typing import List, Tuple, Optional
from config import settings


class RerankerService:
    """Service for reranking search results using cross-encoder"""

    def __init__(self, model_name: str = None):
        """
        Initialize the reranker service

        Args:
            model_name: Name of the cross-encoder model to use
        """
        self.model_name = model_name or settings.reranker_model
        print(f"Loading reranker model: {self.model_name}...")
        self.model = CrossEncoder(self.model_name)
        print(f"✓ Reranker loaded")

    def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: int = None
    ) -> List[Tuple[int, float]]:
        """
        Rerank documents based on relevance to query

        Args:
            query: Search query
            documents: List of document texts to rerank
            top_k: Number of top results to return (default from config)

        Returns:
            List of (index, score) tuples sorted by relevance
        """
        if not documents:
            return []

        top_k = top_k or settings.rerank_top_k

        # Create query-document pairs
        pairs = [[query, doc] for doc in documents]

        # Get relevance scores
        scores = self.model.predict(pairs, show_progress_bar=False)

        # Create (index, score) tuples and sort by score descending
        results = [(idx, float(score)) for idx, score in enumerate(scores)]
        results.sort(key=lambda x: x[1], reverse=True)

        # Return top k
        return results[:top_k]

    def score_pair(self, query: str, document: str) -> float:
        """
        Score a single query-document pair

        Args:
            query: Search query
            document: Document text

        Returns:
            Relevance score
        """
        score = self.model.predict([[query, document]])[0]
        return float(score)

    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            "name": self.model_name,
            "type": "cross-encoder"
        }


# Singleton instance
_reranker_service: Optional[RerankerService] = None


def get_reranker_service() -> RerankerService:
    """Get or create singleton reranker service"""
    global _reranker_service
    if _reranker_service is None and settings.use_reranker:
        _reranker_service = RerankerService()
    return _reranker_service
