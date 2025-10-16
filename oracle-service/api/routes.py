"""
API Routes
REST endpoints for ORACLE service
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from services.chunking import ChunkingService
from services.indexing import get_indexing_service
from services.search import get_search_service
from config import settings


# Request/Response Models

class IndexRequest(BaseModel):
    """Request to index a document"""
    brand: str = Field(..., description="Brand name")
    doc_id: str = Field(..., description="Document identifier")
    text: str = Field(..., description="Document text")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Document metadata")


class SearchRequest(BaseModel):
    """Request to search"""
    brand: str = Field(..., description="Brand name")
    query: str = Field(..., description="Search query")
    top_k: Optional[int] = Field(default=None, description="Number of results")
    use_reranking: Optional[bool] = Field(default=True, description="Use two-stage retrieval")


class ContextRequest(BaseModel):
    """Request for RAG context"""
    brand: str = Field(..., description="Brand name")
    query: str = Field(..., description="Query for context")
    max_tokens: Optional[int] = Field(default=2000, description="Max context tokens")


class DeleteRequest(BaseModel):
    """Request to delete documents"""
    brand: str = Field(..., description="Brand name")
    doc_id: str = Field(..., description="Document ID to delete")


class StatsRequest(BaseModel):
    """Request for statistics"""
    brand: str = Field(..., description="Brand name")


# Create router
router = APIRouter(prefix="/api/v1", tags=["oracle"])


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.service_version
    }


@router.get("/info")
async def service_info():
    """Get service information"""
    from models.embeddings import get_embedding_service
    from models.reranker import get_reranker_service

    embedding_svc = get_embedding_service()
    reranker_svc = get_reranker_service() if settings.use_reranker else None

    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "embedding_model": embedding_svc.get_model_info(),
        "reranker_model": reranker_svc.get_model_info() if reranker_svc else None,
        "config": {
            "chunk_size": settings.chunk_size,
            "chunk_overlap": settings.chunk_overlap,
            "default_top_k": settings.default_top_k,
            "use_reranker": settings.use_reranker
        }
    }


@router.post("/index")
async def index_document(request: IndexRequest):
    """
    Index a document for semantic search

    Args:
        request: IndexRequest with document data

    Returns:
        Indexing result
    """
    try:
        # Get services
        chunking_svc = ChunkingService()
        indexing_svc = get_indexing_service(request.brand)

        # Chunk document
        chunks = chunking_svc.chunk_text(
            text=request.text,
            metadata=request.metadata or {},
            doc_id=request.doc_id
        )

        if not chunks:
            raise HTTPException(status_code=400, detail="No chunks generated from document")

        # Index chunks
        result = indexing_svc.index_chunks(chunks)

        # Get chunk stats
        stats = chunking_svc.get_stats(chunks)

        return {
            "success": result["indexed"] > 0,
            "indexed": result["indexed"],
            "failed": result.get("failed", 0),
            "doc_id": request.doc_id,
            "chunk_stats": stats
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@router.post("/search")
async def search(request: SearchRequest):
    """
    Semantic search in indexed documents

    Args:
        request: SearchRequest with query

    Returns:
        Search results
    """
    try:
        search_svc = get_search_service(request.brand)

        results = search_svc.search(
            query=request.query,
            top_k=request.top_k,
            use_reranking=request.use_reranking
        )

        return {
            "success": True,
            "query": request.query,
            "num_results": len(results),
            "results": [r.to_dict() for r in results]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/context")
async def get_context(request: ContextRequest):
    """
    Get relevant context for RAG (Retrieval-Augmented Generation)

    Args:
        request: ContextRequest

    Returns:
        Context and sources
    """
    try:
        search_svc = get_search_service(request.brand)

        context_data = search_svc.get_context(
            query=request.query,
            max_tokens=request.max_tokens or 2000
        )

        return {
            "success": True,
            "query": request.query,
            **context_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context retrieval failed: {str(e)}")


@router.post("/delete")
async def delete_document(request: DeleteRequest):
    """
    Delete a document and all its chunks

    Args:
        request: DeleteRequest

    Returns:
        Deletion result
    """
    try:
        indexing_svc = get_indexing_service(request.brand)

        result = indexing_svc.delete_by_doc_id(request.doc_id)

        return {
            "success": result["deleted"] > 0,
            "deleted": result["deleted"],
            "doc_id": request.doc_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


@router.post("/stats")
async def get_stats(request: StatsRequest):
    """
    Get collection statistics

    Args:
        request: StatsRequest

    Returns:
        Statistics
    """
    try:
        indexing_svc = get_indexing_service(request.brand)

        stats = indexing_svc.get_stats()

        return {
            "success": True,
            **stats
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")


@router.post("/clear")
async def clear_collection(request: StatsRequest):
    """
    Clear all documents for a brand

    Args:
        request: StatsRequest with brand name

    Returns:
        Deletion result
    """
    try:
        indexing_svc = get_indexing_service(request.brand)

        result = indexing_svc.clear_all()

        return {
            "success": result["deleted"] >= 0,
            **result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear failed: {str(e)}")
