"""
ORACLE Service Configuration
Settings for embeddings, ChromaDB, and semantic search
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Service
    service_name: str = "ORACLE"
    service_version: str = "1.0.0"
    host: str = "127.0.0.1"
    port: int = 8765

    # Embedding Model
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Alternative models (for future):
    # - "sentence-transformers/all-mpnet-base-v2" (768 dim, better quality, slower)
    # - "sentence-transformers/multi-qa-MiniLM-L6-cos-v1" (384 dim, good for Q&A)

    # Reranker Model (optional, for two-stage retrieval)
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    use_reranker: bool = True

    # ChromaDB
    chroma_persist_directory: str = ".brandos/oracle/chroma"
    chroma_collection_prefix: str = "brand_"

    # Document Processing
    chunk_size: int = 512
    chunk_overlap: int = 50
    max_chunks_per_doc: int = 500

    # Search
    default_top_k: int = 10
    rerank_top_k: int = 5
    similarity_threshold: float = 0.5

    # Performance
    batch_size: int = 32
    max_workers: int = 4

    # API
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8080"]

    class Config:
        env_file = ".env"
        env_prefix = "ORACLE_"


# Singleton settings instance
settings = Settings()
