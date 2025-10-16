"""
ORACLE Service - Main Application
FastAPI server for semantic search and document indexing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from api.routes import router
import uvicorn


# Lifespan context for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("=" * 60)
    print(f"🚀 {settings.service_name} v{settings.service_version}")
    print("=" * 60)

    # Startup: Load models
    print("\n📦 Loading models...")

    try:
        from models.embeddings import get_embedding_service
        embedding_svc = get_embedding_service()
        print(f"✓ Embedding model loaded: {embedding_svc.model_name}")

        if settings.use_reranker:
            from models.reranker import get_reranker_service
            reranker_svc = get_reranker_service()
            print(f"✓ Reranker model loaded: {reranker_svc.model_name}")

    except Exception as e:
        print(f"✗ Model loading failed: {e}")
        raise

    print("\n✅ Service ready!")
    print(f"📍 Listening on http://{settings.host}:{settings.port}")
    print(f"📚 API docs: http://{settings.host}:{settings.port}/docs")
    print("=" * 60 + "\n")

    yield

    # Shutdown
    print("\n🔒 Shutting down ORACLE service...")


# Create FastAPI app
app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    description="Semantic search and document indexing service using ChromaDB and Sentence Transformers",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "running",
        "docs": "/docs",
        "api": "/api/v1"
    }


# Run with: python main.py
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level="info"
    )
