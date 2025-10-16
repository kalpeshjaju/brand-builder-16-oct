"""
Document Chunking Service
Intelligent text chunking for semantic search
"""

from typing import List, Dict, Any
import re
from config import settings


class DocumentChunk:
    """Represents a chunk of a document"""

    def __init__(
        self,
        text: str,
        metadata: Dict[str, Any],
        chunk_id: str,
        start_offset: int = 0,
        end_offset: int = 0
    ):
        self.text = text
        self.metadata = metadata
        self.chunk_id = chunk_id
        self.start_offset = start_offset
        self.end_offset = end_offset

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "text": self.text,
            "metadata": self.metadata,
            "chunk_id": self.chunk_id,
            "start_offset": self.start_offset,
            "end_offset": self.end_offset
        }


class ChunkingService:
    """Service for chunking documents into searchable segments"""

    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None,
        max_chunks: int = None
    ):
        """
        Initialize chunking service

        Args:
            chunk_size: Target size of each chunk (characters)
            chunk_overlap: Overlap between chunks (characters)
            max_chunks: Maximum chunks per document
        """
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap
        self.max_chunks = max_chunks or settings.max_chunks_per_doc

    def chunk_text(
        self,
        text: str,
        metadata: Dict[str, Any] = None,
        doc_id: str = "unknown"
    ) -> List[DocumentChunk]:
        """
        Chunk a text document

        Args:
            text: Full document text
            metadata: Document metadata
            doc_id: Document identifier

        Returns:
            List of DocumentChunk objects
        """
        if not text or not text.strip():
            return []

        metadata = metadata or {}

        # Clean text
        text = self._clean_text(text)

        # Try semantic chunking first (by paragraphs/sections)
        chunks = self._semantic_chunk(text)

        # If chunks are too large, split them further
        final_chunks = []
        for chunk_text in chunks:
            if len(chunk_text) > self.chunk_size * 1.5:
                # Split large chunks by sentences
                sub_chunks = self._split_by_sentences(chunk_text)
                final_chunks.extend(sub_chunks)
            else:
                final_chunks.append(chunk_text)

        # Limit number of chunks
        if len(final_chunks) > self.max_chunks:
            print(f"Warning: Document has {len(final_chunks)} chunks, limiting to {self.max_chunks}")
            final_chunks = final_chunks[:self.max_chunks]

        # Create DocumentChunk objects
        result = []
        offset = 0
        for idx, chunk_text in enumerate(final_chunks):
            chunk_id = f"{doc_id}_chunk_{idx}"

            chunk = DocumentChunk(
                text=chunk_text,
                metadata={
                    **metadata,
                    "chunk_index": idx,
                    "total_chunks": len(final_chunks),
                    "doc_id": doc_id
                },
                chunk_id=chunk_id,
                start_offset=offset,
                end_offset=offset + len(chunk_text)
            )
            result.append(chunk)
            offset += len(chunk_text)

        return result

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove control characters
        text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', text)

        return text.strip()

    def _semantic_chunk(self, text: str) -> List[str]:
        """
        Chunk text semantically (by paragraphs/sections)

        Args:
            text: Input text

        Returns:
            List of chunk texts
        """
        # Split by double newlines (paragraphs)
        paragraphs = re.split(r'\n\n+', text)

        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # If adding this paragraph exceeds chunk size, save current chunk
            if current_chunk and len(current_chunk) + len(para) > self.chunk_size:
                chunks.append(current_chunk.strip())
                # Keep overlap
                current_chunk = current_chunk[-self.chunk_overlap:] + " " + para
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para

        # Add final chunk
        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def _split_by_sentences(self, text: str) -> List[str]:
        """
        Split text into chunks by sentences

        Args:
            text: Input text

        Returns:
            List of chunk texts
        """
        # Simple sentence splitting (handles . ! ?)
        sentences = re.split(r'(?<=[.!?])\s+', text)

        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if not sentence.strip():
                continue

            # If adding this sentence exceeds chunk size, save current chunk
            if current_chunk and len(current_chunk) + len(sentence) > self.chunk_size:
                chunks.append(current_chunk.strip())
                # Keep overlap
                overlap_sentences = current_chunk.split('. ')[-2:]
                current_chunk = '. '.join(overlap_sentences) + " " + sentence
            else:
                if current_chunk:
                    current_chunk += " " + sentence
                else:
                    current_chunk = sentence

        # Add final chunk
        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def get_stats(self, chunks: List[DocumentChunk]) -> Dict[str, Any]:
        """
        Get statistics about chunks

        Args:
            chunks: List of chunks

        Returns:
            Statistics dictionary
        """
        if not chunks:
            return {
                "count": 0,
                "avg_length": 0,
                "min_length": 0,
                "max_length": 0,
                "total_chars": 0
            }

        lengths = [len(c.text) for c in chunks]

        return {
            "count": len(chunks),
            "avg_length": sum(lengths) // len(lengths),
            "min_length": min(lengths),
            "max_length": max(lengths),
            "total_chars": sum(lengths)
        }
