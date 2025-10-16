"""
Indexing Service
ChromaDB integration for vector storage and retrieval
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
from pathlib import Path
from models.embeddings import get_embedding_service
from services.chunking import DocumentChunk
from config import settings
import hashlib


class IndexingService:
    """Service for indexing and querying documents in ChromaDB"""

    def __init__(self, brand_name: str):
        """
        Initialize indexing service for a brand

        Args:
            brand_name: Brand identifier (creates separate collection)
        """
        self.brand_name = brand_name
        self.collection_name = f"{settings.chroma_collection_prefix}{brand_name.lower().replace(' ', '_')}"

        # Ensure persist directory exists
        persist_path = Path(settings.chroma_persist_directory)
        persist_path.mkdir(parents=True, exist_ok=True)

        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=str(persist_path),
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Get embedding service
        self.embedding_service = get_embedding_service()

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"brand": brand_name}
        )

        print(f"✓ ChromaDB collection ready: {self.collection_name}")

    def index_chunks(self, chunks: List[DocumentChunk]) -> Dict[str, Any]:
        """
        Index document chunks in ChromaDB

        Args:
            chunks: List of DocumentChunk objects

        Returns:
            Indexing statistics
        """
        if not chunks:
            return {"indexed": 0, "failed": 0}

        print(f"Indexing {len(chunks)} chunks...")

        # Prepare data for batch insert
        ids = []
        documents = []
        metadatas = []
        embeddings = []

        for chunk in chunks:
            # Generate unique ID
            chunk_hash = hashlib.sha256(chunk.text.encode()).hexdigest()[:16]
            chunk_id = f"{chunk.chunk_id}_{chunk_hash}"

            ids.append(chunk_id)
            documents.append(chunk.text)

            # Convert metadata to serializable format
            metadata = {
                k: str(v) if not isinstance(v, (str, int, float, bool)) else v
                for k, v in chunk.metadata.items()
            }
            metadata["chunk_index"] = chunk.metadata.get("chunk_index", 0)
            metadata["start_offset"] = chunk.start_offset
            metadata["end_offset"] = chunk.end_offset

            metadatas.append(metadata)

        # Generate embeddings in batch
        print("Generating embeddings...")
        embeddings = self.embedding_service.embed_texts(documents)

        # Add to ChromaDB
        try:
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings
            )

            print(f"✓ Indexed {len(chunks)} chunks")

            return {
                "indexed": len(chunks),
                "failed": 0,
                "collection": self.collection_name
            }

        except Exception as e:
            print(f"✗ Indexing failed: {e}")
            return {
                "indexed": 0,
                "failed": len(chunks),
                "error": str(e)
            }

    def search(
        self,
        query: str,
        top_k: int = None,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Semantic search in the index

        Args:
            query: Search query
            top_k: Number of results to return
            filter_metadata: Metadata filters (optional)

        Returns:
            List of search results with scores
        """
        top_k = top_k or settings.default_top_k

        # Generate query embedding
        query_embedding = self.embedding_service.embed_text(query)

        # Search in ChromaDB
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter_metadata
            )

            # Format results
            formatted_results = []
            for i in range(len(results['ids'][0])):
                result = {
                    "id": results['ids'][0][i],
                    "text": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i] if 'distances' in results else None,
                    "similarity": 1 - results['distances'][0][i] if 'distances' in results else None
                }

                # Filter by similarity threshold
                if result['similarity'] and result['similarity'] >= settings.similarity_threshold:
                    formatted_results.append(result)

            return formatted_results

        except Exception as e:
            print(f"✗ Search failed: {e}")
            return []

    def delete_by_doc_id(self, doc_id: str) -> Dict[str, Any]:
        """
        Delete all chunks for a document

        Args:
            doc_id: Document identifier

        Returns:
            Deletion statistics
        """
        try:
            # Query to find all chunks for this doc
            results = self.collection.get(
                where={"doc_id": doc_id}
            )

            if not results['ids']:
                return {"deleted": 0, "doc_id": doc_id}

            # Delete by IDs
            self.collection.delete(ids=results['ids'])

            print(f"✓ Deleted {len(results['ids'])} chunks for doc {doc_id}")

            return {
                "deleted": len(results['ids']),
                "doc_id": doc_id
            }

        except Exception as e:
            print(f"✗ Deletion failed: {e}")
            return {
                "deleted": 0,
                "error": str(e)
            }

    def clear_all(self) -> Dict[str, Any]:
        """
        Clear all documents from the collection

        Returns:
            Deletion statistics
        """
        try:
            count = self.collection.count()
            self.client.delete_collection(name=self.collection_name)

            # Recreate empty collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"brand": self.brand_name}
            )

            print(f"✓ Cleared collection: {count} documents deleted")

            return {
                "deleted": count,
                "collection": self.collection_name
            }

        except Exception as e:
            print(f"✗ Clear failed: {e}")
            return {
                "deleted": 0,
                "error": str(e)
            }

    def get_stats(self) -> Dict[str, Any]:
        """
        Get collection statistics

        Returns:
            Statistics dictionary
        """
        try:
            count = self.collection.count()

            # Get sample documents to analyze
            sample = self.collection.peek(limit=10)

            doc_ids = set()
            if sample['metadatas']:
                for metadata in sample['metadatas']:
                    if 'doc_id' in metadata:
                        doc_ids.add(metadata['doc_id'])

            return {
                "collection_name": self.collection_name,
                "brand": self.brand_name,
                "total_chunks": count,
                "sample_doc_count": len(doc_ids),
                "embedding_dimension": self.embedding_service.get_dimension()
            }

        except Exception as e:
            print(f"✗ Failed to get stats: {e}")
            return {
                "error": str(e)
            }


# Cache of indexing services by brand
_indexing_services: Dict[str, IndexingService] = {}


def get_indexing_service(brand_name: str) -> IndexingService:
    """
    Get or create indexing service for a brand

    Args:
        brand_name: Brand identifier

    Returns:
        IndexingService instance
    """
    if brand_name not in _indexing_services:
        _indexing_services[brand_name] = IndexingService(brand_name)
    return _indexing_services[brand_name]
