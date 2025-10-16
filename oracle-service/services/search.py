"""
Search Service
Two-stage semantic search with optional reranking
"""

from typing import List, Dict, Any, Optional
from services.indexing import get_indexing_service
from models.reranker import get_reranker_service
from config import settings


class SearchResult:
    """Represents a search result"""

    def __init__(
        self,
        text: str,
        score: float,
        metadata: Dict[str, Any],
        chunk_id: str,
        rank: int = 0,
        rerank_score: Optional[float] = None
    ):
        self.text = text
        self.score = score
        self.metadata = metadata
        self.chunk_id = chunk_id
        self.rank = rank
        self.rerank_score = rerank_score

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = {
            "text": self.text,
            "score": self.score,
            "metadata": self.metadata,
            "chunk_id": self.chunk_id,
            "rank": self.rank
        }

        if self.rerank_score is not None:
            result["rerank_score"] = self.rerank_score

        return result


class SearchService:
    """Service for semantic search with optional reranking"""

    def __init__(self, brand_name: str):
        """
        Initialize search service

        Args:
            brand_name: Brand identifier
        """
        self.brand_name = brand_name
        self.indexing_service = get_indexing_service(brand_name)

        # Optional reranker
        self.reranker = None
        if settings.use_reranker:
            try:
                self.reranker = get_reranker_service()
            except Exception as e:
                print(f"Warning: Could not load reranker: {e}")

    def search(
        self,
        query: str,
        top_k: int = None,
        use_reranking: bool = True,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """
        Perform semantic search with optional reranking

        Args:
            query: Search query
            top_k: Number of final results (default from config)
            use_reranking: Whether to use two-stage retrieval
            filter_metadata: Metadata filters

        Returns:
            List of SearchResult objects
        """
        top_k = top_k or settings.default_top_k

        # Stage 1: Dense retrieval with embeddings
        # Retrieve more candidates if we're reranking
        retrieval_k = top_k * 2 if (use_reranking and self.reranker) else top_k

        initial_results = self.indexing_service.search(
            query=query,
            top_k=retrieval_k,
            filter_metadata=filter_metadata
        )

        if not initial_results:
            return []

        # Stage 2: Reranking (optional)
        if use_reranking and self.reranker:
            results = self._rerank_results(query, initial_results, top_k)
        else:
            # No reranking, just use initial results
            results = [
                SearchResult(
                    text=r['text'],
                    score=r['similarity'],
                    metadata=r['metadata'],
                    chunk_id=r['id'],
                    rank=idx + 1
                )
                for idx, r in enumerate(initial_results[:top_k])
            ]

        return results

    def _rerank_results(
        self,
        query: str,
        initial_results: List[Dict[str, Any]],
        top_k: int
    ) -> List[SearchResult]:
        """
        Rerank initial results using cross-encoder

        Args:
            query: Search query
            initial_results: Results from dense retrieval
            top_k: Number of final results

        Returns:
            Reranked SearchResult objects
        """
        # Extract texts for reranking
        texts = [r['text'] for r in initial_results]

        # Rerank
        reranked_indices = self.reranker.rerank(query, texts, top_k=top_k)

        # Create SearchResult objects with rerank scores
        results = []
        for rank, (idx, rerank_score) in enumerate(reranked_indices):
            original_result = initial_results[idx]

            result = SearchResult(
                text=original_result['text'],
                score=original_result['similarity'],
                metadata=original_result['metadata'],
                chunk_id=original_result['id'],
                rank=rank + 1,
                rerank_score=rerank_score
            )
            results.append(result)

        return results

    def hybrid_search(
        self,
        query: str,
        keywords: List[str],
        top_k: int = None
    ) -> List[SearchResult]:
        """
        Hybrid search combining semantic and keyword matching

        Args:
            query: Semantic search query
            keywords: Keywords for filtering
            top_k: Number of results

        Returns:
            Search results
        """
        # TODO: Implement hybrid search with keyword boosting
        # For now, just do semantic search
        return self.search(query, top_k=top_k)

    def search_by_document(
        self,
        query: str,
        doc_id: str,
        top_k: int = 5
    ) -> List[SearchResult]:
        """
        Search within a specific document

        Args:
            query: Search query
            doc_id: Document to search within
            top_k: Number of results

        Returns:
            Search results from that document
        """
        return self.search(
            query=query,
            top_k=top_k,
            filter_metadata={"doc_id": doc_id}
        )

    def get_context(
        self,
        query: str,
        max_tokens: int = 2000,
        use_reranking: bool = True
    ) -> Dict[str, Any]:
        """
        Get relevant context for a query (for RAG)

        Args:
            query: Search query
            max_tokens: Maximum tokens in context (approximate)
            use_reranking: Use two-stage retrieval

        Returns:
            Context dictionary with text and sources
        """
        # Estimate ~4 chars per token
        max_chars = max_tokens * 4

        results = self.search(query, top_k=10, use_reranking=use_reranking)

        # Combine results until we hit max_chars
        context_parts = []
        sources = []
        total_chars = 0

        for result in results:
            if total_chars + len(result.text) > max_chars:
                break

            context_parts.append(result.text)
            sources.append({
                "chunk_id": result.chunk_id,
                "score": result.score,
                "rank": result.rank,
                "metadata": result.metadata
            })
            total_chars += len(result.text)

        context_text = "\n\n---\n\n".join(context_parts)

        return {
            "context": context_text,
            "sources": sources,
            "total_chars": total_chars,
            "num_sources": len(sources)
        }


# Cache of search services by brand
_search_services: Dict[str, SearchService] = {}


def get_search_service(brand_name: str) -> SearchService:
    """
    Get or create search service for a brand

    Args:
        brand_name: Brand identifier

    Returns:
        SearchService instance
    """
    if brand_name not in _search_services:
        _search_services[brand_name] = SearchService(brand_name)
    return _search_services[brand_name]
