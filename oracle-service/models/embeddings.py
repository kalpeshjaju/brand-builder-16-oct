"""
Embedding Service
Generates vector embeddings using Sentence Transformers
"""

from sentence_transformers import SentenceTransformer
from typing import List, Union
import numpy as np
from config import settings


class EmbeddingService:
    """Service for generating text embeddings"""

    def __init__(self, model_name: str = None):
        """
        Initialize the embedding service

        Args:
            model_name: Name of the sentence-transformers model to use
        """
        self.model_name = model_name or settings.embedding_model
        print(f"Loading embedding model: {self.model_name}...")
        self.model = SentenceTransformer(self.model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"✓ Model loaded. Embedding dimension: {self.dimension}")

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text

        Args:
            text: Input text

        Returns:
            Embedding vector as list of floats
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def embed_texts(self, texts: List[str], batch_size: int = None) -> List[List[float]]:
        """
        Generate embeddings for multiple texts

        Args:
            texts: List of input texts
            batch_size: Batch size for processing (default from config)

        Returns:
            List of embedding vectors
        """
        batch_size = batch_size or settings.batch_size

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
            convert_to_numpy=True
        )

        return embeddings.tolist()

    def similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Similarity score (0-1)
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        # Cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    def get_dimension(self) -> int:
        """Get embedding dimension"""
        return self.dimension

    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            "name": self.model_name,
            "dimension": self.dimension,
            "max_seq_length": self.model.max_seq_length,
        }


# Singleton instance
_embedding_service: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    """Get or create singleton embedding service"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
