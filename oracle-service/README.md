# ORACLE Service

**Semantic Search & Document Indexing Service**

Python FastAPI service providing semantic search capabilities using ChromaDB and Sentence Transformers.

## Features

- **Semantic Search** - Find relevant information without exact keyword matches
- **Two-Stage Retrieval** - Fast vector search + precision reranking with cross-encoder
- **Document Chunking** - Intelligent text segmentation for optimal retrieval
- **Vector Storage** - Persistent ChromaDB storage
- **Per-Brand Collections** - Isolated data for each brand
- **RAG-Ready** - Context retrieval optimized for LLM prompts

## Architecture

```
┌─────────────────────────────────────────┐
│ FastAPI REST API                        │
├─────────────────────────────────────────┤
│ Search Service (Two-stage retrieval)    │
├─────────────────────────────────────────┤
│ ChromaDB (Vector storage)               │
│ Sentence Transformers (Embeddings)      │
│ Cross-Encoder (Reranking)               │
└─────────────────────────────────────────┘
```

## Installation

### 1. Create Python virtual environment

```bash
cd oracle-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI & Uvicorn (web server)
- ChromaDB (vector database)
- Sentence Transformers (embeddings)
- PyTorch (ML backend)
- Document processing libraries

**First run may take 5-10 minutes** as it downloads ML models (~500MB).

## Usage

### Start the service

```bash
python main.py
```

Service starts on `http://127.0.0.1:8765`

### API Documentation

Interactive docs: `http://127.0.0.1:8765/docs`

### API Endpoints

**Health Check**
```bash
GET /api/v1/health
```

**Service Info**
```bash
GET /api/v1/info
```

**Index Document**
```bash
POST /api/v1/index
{
  "brand": "Acme",
  "doc_id": "website-homepage",
  "text": "Full document text...",
  "metadata": {
    "source": "website",
    "url": "https://example.com"
  }
}
```

**Semantic Search**
```bash
POST /api/v1/search
{
  "brand": "Acme",
  "query": "What are the company values?",
  "top_k": 5,
  "use_reranking": true
}
```

**Get Context (for RAG)**
```bash
POST /api/v1/context
{
  "brand": "Acme",
  "query": "Tell me about sustainability",
  "max_tokens": 2000
}
```

**Get Statistics**
```bash
POST /api/v1/stats
{
  "brand": "Acme"
}
```

**Delete Document**
```bash
POST /api/v1/delete
{
  "brand": "Acme",
  "doc_id": "website-homepage"
}
```

## Configuration

Edit `config.py` or set environment variables:

```bash
# Embedding Model
ORACLE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Reranker
ORACLE_USE_RERANKER=true

# ChromaDB
ORACLE_CHROMA_PERSIST_DIRECTORY=.brandos/oracle/chroma

# Chunking
ORACLE_CHUNK_SIZE=512
ORACLE_CHUNK_OVERLAP=50

# Search
ORACLE_DEFAULT_TOP_K=10
ORACLE_SIMILARITY_THRESHOLD=0.5
```

## Models

**Default Embedding Model:**
- `sentence-transformers/all-MiniLM-L6-v2`
- 384 dimensions
- Fast, good quality
- ~90MB download

**Alternative Models:**
- `all-mpnet-base-v2` - 768d, better quality, slower (~420MB)
- `multi-qa-MiniLM-L6-cos-v1` - 384d, optimized for Q&A (~90MB)

**Reranker:**
- `cross-encoder/ms-marco-MiniLM-L-6-v2`
- Improves precision significantly
- ~80MB download

## Development

### Project Structure

```
oracle-service/
├── main.py                 # FastAPI app
├── config.py               # Configuration
├── requirements.txt        # Dependencies
├── models/
│   ├── embeddings.py       # Sentence Transformers
│   └── reranker.py         # Cross-encoder
├── services/
│   ├── chunking.py         # Document chunking
│   ├── indexing.py         # ChromaDB integration
│   └── search.py           # Semantic search
└── api/
    └── routes.py           # REST endpoints
```

### Testing

```bash
# Start service
python main.py

# In another terminal, test with curl:
curl -X POST http://127.0.0.1:8765/api/v1/index \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "TestBrand",
    "doc_id": "test-doc-1",
    "text": "This is a test document about sustainable fashion.",
    "metadata": {"source": "test"}
  }'

curl -X POST http://127.0.0.1:8765/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "TestBrand",
    "query": "sustainability",
    "top_k": 3
  }'
```

## Data Storage

ChromaDB data persists in: `.brandos/oracle/chroma/`

Each brand gets its own collection: `brand_{brand_name}`

## Performance

- **Indexing**: ~100-200 chunks/second
- **Search**: ~50-100ms per query
- **Reranking**: +20-50ms overhead

## Integration with Brand Builder Pro

The TypeScript application communicates with ORACLE via REST API:

```typescript
import { OracleClient } from './library/oracle-client';

const oracle = new OracleClient('http://127.0.0.1:8765');

// Index document
await oracle.indexDocument('Acme', 'doc-1', documentText, metadata);

// Search
const results = await oracle.search('Acme', 'What are our values?');

// Get context for LLM
const context = await oracle.getContext('Acme', 'sustainability practices');
```

## Troubleshooting

**Service won't start:**
- Check Python version (3.10+ required)
- Ensure all dependencies installed: `pip install -r requirements.txt`
- Check port 8765 is not in use

**Models not downloading:**
- Check internet connection
- Try manual download: `python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"`

**Out of memory:**
- Use smaller embedding model
- Reduce batch_size in config
- Reduce chunk_size

**Search quality issues:**
- Enable reranker (use_reranker=true)
- Adjust similarity_threshold
- Try different embedding model
- Check document chunking quality

## License

Part of Brand Builder Pro v1.1.0
