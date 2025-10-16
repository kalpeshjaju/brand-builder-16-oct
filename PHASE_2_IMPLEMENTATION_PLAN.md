# Phase 2 Implementation Plan - Core Enhancements

**Version**: 2.0.0 (Planned)
**Date**: October 16, 2025
**Focus**: Internal Power User Features
**Philosophy**: Strong, capable tool for single-user internal testing

---

## Overview

Building 4 core features that make Brand Builder Pro a truly powerful brand intelligence tool:

1. **Prompt Registry** - Version control for all LLM prompts
2. **ORACLE Module** - Semantic search with ChromaDB (Python bridge)
3. **Advanced Ingestion** - Real PDF/DOCX parsing
4. **File Watchers** - Auto-detect and process new files

**Target User**: Internal testing (single user, no multi-tenancy needed)
**Priority**: Functionality and quality over scale and security
**Timeline**: 3-4 weeks focused development

---

## 1. Prompt Registry - Version Control Prompts

### Problem
Currently, prompts are hardcoded in the LLM service. No way to:
- Track which prompt version generated which output
- Rollback to previous prompt versions
- A/B test different prompts
- Maintain prompt library across commands

### Solution Architecture

#### Data Structure

```typescript
// src/types/prompt-types.ts
export interface PromptTemplate {
  id: string;              // "brand-strategy-v1"
  name: string;            // "Brand Strategy Generation"
  description: string;     // What this prompt does
  category: 'generation' | 'analysis' | 'qa' | 'audit';
  version: string;         // "1.0.0"
  createdAt: string;
  updatedAt: string;
  active: boolean;         // Current active version

  // Prompt content
  systemPrompt: string;    // System-level instructions
  userPromptTemplate: string; // With {{placeholders}}

  // Configuration
  temperature: number;
  maxTokens: number;
  seed?: number;

  // Metadata
  tags: string[];
  author: string;
  changelog: string[];     // Version history

  // Usage tracking
  usageCount: number;
  avgConfidence?: number;
  lastUsed?: string;
}

export interface PromptVersion {
  promptId: string;
  version: string;
  timestamp: string;
  changes: string;
  previousVersion?: string;
}
```

#### File Structure

```
.brandos/
└── prompts/
    ├── registry.json              # All prompts index
    ├── versions/                  # Version history
    │   ├── brand-strategy/
    │   │   ├── v1.0.0.json
    │   │   ├── v1.1.0.json
    │   │   └── v2.0.0.json
    │   ├── competitive-analysis/
    │   └── audience-research/
    └── active/                    # Current active versions (symlinks)
        ├── brand-strategy.json
        ├── competitive-analysis.json
        └── audience-research.json
```

#### Implementation

**PromptRegistry Class** (src/genesis/prompt-registry.ts)

```typescript
export class PromptRegistry {
  private registryPath: string;
  private cache: Map<string, PromptTemplate>;

  constructor() {
    this.registryPath = FileSystemUtils.resolvePath('.brandos/prompts/registry.json');
    this.cache = new Map();
  }

  // Core methods
  async initialize(): Promise<void>;
  async registerPrompt(template: PromptTemplate): Promise<void>;
  async getPrompt(id: string, version?: string): Promise<PromptTemplate>;
  async getActivePrompt(category: string): Promise<PromptTemplate>;
  async updatePrompt(id: string, updates: Partial<PromptTemplate>): Promise<void>;
  async createVersion(id: string, changes: string): Promise<string>; // Returns new version
  async setActive(id: string, version: string): Promise<void>;
  async listPrompts(category?: string): Promise<PromptTemplate[]>;
  async getVersionHistory(id: string): Promise<PromptVersion[]>;
  async rollback(id: string, toVersion: string): Promise<void>;

  // Templating
  renderPrompt(template: string, variables: Record<string, string>): string;

  // Analytics
  async trackUsage(id: string, confidence?: number): Promise<void>;
  async getUsageStats(id: string): Promise<UsageStats>;
}
```

#### Built-in Prompts

**1. Brand Strategy Generation**
```json
{
  "id": "brand-strategy-gen-v1",
  "name": "Brand Strategy Generation",
  "category": "generation",
  "version": "1.0.0",
  "systemPrompt": "You are a senior brand strategist...",
  "userPromptTemplate": "Generate a comprehensive brand strategy for {{brandName}} in the {{industry}} industry. Focus on: {{aspects}}",
  "temperature": 0.0,
  "maxTokens": 8000,
  "tags": ["strategy", "generation", "comprehensive"]
}
```

**2. Competitive Analysis**
```json
{
  "id": "competitive-analysis-v1",
  "name": "Competitive Analysis",
  "category": "analysis",
  "userPromptTemplate": "Analyze {{brandName}} vs competitors {{competitors}} across dimensions: {{dimensions}}"
}
```

**3. Audience Research**
**4. Positioning Statement**
**5. Messaging Framework**
**6. Content Strategy**

#### CLI Integration

```bash
# New commands
brandos prompts list                           # List all prompts
brandos prompts show brand-strategy-v1         # Show prompt details
brandos prompts create --template new.json     # Register new prompt
brandos prompts update brand-strategy --version 1.1.0
brandos prompts activate brand-strategy v1.1.0 # Set active
brandos prompts history brand-strategy         # Version history
brandos prompts rollback brand-strategy v1.0.0 # Rollback

# Use specific prompt version in generate
brandos generate --brand "Revaa" --prompt brand-strategy-v1.1.0
```

#### Integration with LLMService

```typescript
// Enhanced LLMService
class LLMService {
  private promptRegistry: PromptRegistry;

  async promptFromRegistry(
    promptId: string,
    variables: Record<string, string>,
    version?: string
  ): Promise<LLMResponse> {
    const template = await this.promptRegistry.getPrompt(promptId, version);
    const renderedPrompt = this.promptRegistry.renderPrompt(
      template.userPromptTemplate,
      variables
    );

    const response = await this.promptWithMetadata(
      renderedPrompt,
      template.systemPrompt,
      {
        temperature: template.temperature,
        maxTokens: template.maxTokens,
        seed: template.seed
      }
    );

    // Add prompt metadata
    response.metadata.promptId = promptId;
    response.metadata.promptVersion = template.version;

    // Track usage
    await this.promptRegistry.trackUsage(promptId);

    return response;
  }
}
```

### Benefits

✅ **Version Control** - Track every prompt change
✅ **Reproducibility** - Know exactly which prompt generated which output
✅ **Experimentation** - Easy A/B testing of prompts
✅ **Rollback** - Undo bad prompt changes
✅ **Library** - Build reusable prompt templates
✅ **Analytics** - Track which prompts work best

### Implementation Effort

**Estimated Time**: 3-4 days
- Day 1: Data structures, PromptRegistry class
- Day 2: File operations, versioning logic
- Day 3: CLI commands, LLM integration
- Day 4: Built-in prompts, testing

**Files to Create**:
- src/types/prompt-types.ts
- src/genesis/prompt-registry.ts
- src/cli/commands/prompts.ts
- .brandos/prompts/registry.json (template)

**Files to Modify**:
- src/genesis/llm-service.ts (add registry integration)
- src/cli/index.ts (add prompts commands)

---

## 2. ORACLE Module - Semantic Search (ChromaDB)

### Problem
Currently, asking questions only uses basic context from JSON files. Need:
- Semantic search across all ingested documents
- Find relevant information even with different wording
- Rank results by relevance
- Two-stage retrieval (fast + accurate)

### Solution Architecture

#### Overview

```
TypeScript (CLI)  ←→  Python Service (ChromaDB)
     │                       │
     │                       ├── ChromaDB (vector storage)
     │                       ├── Embeddings (OpenAI/Claude)
     │                       └── Retrieval logic
     │
     └── JSON-RPC bridge ──→
```

#### Tech Stack

- **ChromaDB**: Vector database for embeddings
- **Sentence Transformers**: For embeddings (or OpenAI API)
- **Python FastAPI**: HTTP bridge for TypeScript ↔ Python
- **JSON-RPC**: Communication protocol

#### Python Service Architecture

**Directory Structure**:
```
oracle-service/
├── requirements.txt
├── main.py                    # FastAPI server
├── oracle/
│   ├── __init__.py
│   ├── embedding.py           # Embedding generation
│   ├── retrieval.py           # Search logic
│   ├── chroma_client.py       # ChromaDB wrapper
│   └── reranker.py            # Two-stage reranking
├── config.py
└── tests/
```

**Core Components**:

```python
# oracle/embedding.py
class EmbeddingService:
    def __init__(self, provider='sentence-transformers'):
        if provider == 'sentence-transformers':
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        elif provider == 'openai':
            self.client = OpenAI()

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text"""
        pass

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embedding generation"""
        pass

# oracle/chroma_client.py
class ChromaManager:
    def __init__(self, persist_directory='.brandos/chroma_db'):
        self.client = chromadb.PersistentClient(path=persist_directory)

    def get_or_create_collection(self, brand_name: str):
        """Get brand-specific collection"""
        return self.client.get_or_create_collection(
            name=f"brand_{brand_name.lower()}",
            metadata={"brand": brand_name}
        )

    def add_documents(self, collection, documents: List[Document]):
        """Add documents with embeddings"""
        pass

    def query(self, collection, query_embedding, k=10):
        """Semantic search"""
        pass

# oracle/retrieval.py
class SemanticRetriever:
    def __init__(self, embedding_service, chroma_manager):
        self.embedder = embedding_service
        self.chroma = chroma_manager

    def search(self, brand: str, query: str, k=5, mode='balanced'):
        """
        Two-stage retrieval:
        1. Dense retrieval (ChromaDB) - Get top 20
        2. Reranking (cross-encoder) - Rank top 5
        """
        # Stage 1: Dense retrieval
        query_embedding = self.embedder.embed_text(query)
        collection = self.chroma.get_or_create_collection(brand)
        candidates = self.chroma.query(collection, query_embedding, k=20)

        # Stage 2: Rerank
        reranked = self.reranker.rerank(query, candidates, top_k=k)

        return reranked

    def index_document(self, brand: str, doc: Document):
        """Index document for brand"""
        # Chunk document
        chunks = self.chunk_document(doc)

        # Generate embeddings
        embeddings = self.embedder.embed_batch([c.text for c in chunks])

        # Store in ChromaDB
        collection = self.chroma.get_or_create_collection(brand)
        collection.add(
            embeddings=embeddings,
            documents=[c.text for c in chunks],
            metadatas=[c.metadata for c in chunks],
            ids=[c.id for c in chunks]
        )

# main.py - FastAPI Server
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
retriever = SemanticRetriever(EmbeddingService(), ChromaManager())

class SearchRequest(BaseModel):
    brand: str
    query: str
    k: int = 5
    mode: str = 'balanced'

class IndexRequest(BaseModel):
    brand: str
    document: dict

@app.post("/search")
async def search(request: SearchRequest):
    results = retriever.search(
        request.brand,
        request.query,
        k=request.k,
        mode=request.mode
    )
    return {"results": results}

@app.post("/index")
async def index_document(request: IndexRequest):
    doc = Document(**request.document)
    retriever.index_document(request.brand, doc)
    return {"status": "indexed", "doc_id": doc.id}

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

#### TypeScript Client

```typescript
// src/oracle/oracle-client.ts
export class OracleClient {
  private serviceUrl: string;
  private axios: AxiosInstance;

  constructor(serviceUrl = 'http://localhost:8765') {
    this.serviceUrl = serviceUrl;
    this.axios = axios.create({ baseURL: serviceUrl });
  }

  async search(params: {
    brand: string;
    query: string;
    k?: number;
    mode?: 'fast' | 'balanced' | 'precise';
  }): Promise<SearchResult[]> {
    const response = await this.axios.post('/search', params);
    return response.data.results;
  }

  async indexDocument(brand: string, document: Document): Promise<void> {
    await this.axios.post('/index', { brand, document });
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.axios.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  async startService(): Promise<void> {
    // Start Python service if not running
    const isHealthy = await this.health();
    if (!isHealthy) {
      logger.info('Starting ORACLE service...');
      spawn('python', ['oracle-service/main.py'], {
        detached: true,
        stdio: 'ignore'
      });
      // Wait for service to be ready
      await this.waitForHealth();
    }
  }

  private async waitForHealth(maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.health()) return;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('ORACLE service failed to start');
  }
}
```

#### Enhanced Ask Command

```typescript
// src/cli/commands/ask.ts (enhanced)
export async function askCommand(query: string, options: AskCommandOptions) {
  const { brand, strategy, sources } = options;

  // Start ORACLE service
  const oracle = new OracleClient();
  await oracle.startService();

  // Semantic search for relevant context
  const searchResults = await oracle.search({
    brand,
    query,
    k: parseInt(sources) || 5,
    mode: strategy || 'balanced'
  });

  // Build context from search results
  const context = searchResults.map(r => ({
    text: r.text,
    source: r.metadata.source,
    confidence: r.score
  }));

  // Generate answer with LLM
  const llm = new LLMService();
  const response = await llm.promptFromRegistry(
    'qa-with-context-v1',
    {
      query,
      context: JSON.stringify(context),
      brandName: brand
    }
  );

  // Display results
  console.log(chalk.bold('Answer:'));
  console.log(response.content);

  console.log(chalk.dim('\nSources:'));
  context.forEach((c, i) => {
    console.log(chalk.dim(`  ${i+1}. ${c.source} (confidence: ${c.confidence.toFixed(2)})`));
  });
}
```

#### Document Chunking Strategy

```python
# oracle/chunking.py
class DocumentChunker:
    def chunk_by_semantic_units(
        self,
        text: str,
        chunk_size=512,
        overlap=50
    ) -> List[Chunk]:
        """
        Smart chunking:
        1. Split by paragraphs first
        2. Keep semantic units together (sentences)
        3. Maintain overlap for context
        """
        paragraphs = text.split('\n\n')
        chunks = []

        for para in paragraphs:
            sentences = sent_tokenize(para)
            current_chunk = []
            current_size = 0

            for sent in sentences:
                sent_size = len(sent.split())
                if current_size + sent_size > chunk_size and current_chunk:
                    chunks.append(Chunk(
                        text=' '.join(current_chunk),
                        size=current_size
                    ))
                    # Overlap: keep last sentence
                    current_chunk = current_chunk[-1:] if overlap else []
                    current_size = len(current_chunk[0].split()) if current_chunk else 0

                current_chunk.append(sent)
                current_size += sent_size

            if current_chunk:
                chunks.append(Chunk(text=' '.join(current_chunk), size=current_size))

        return chunks
```

### CLI Usage

```bash
# Start ORACLE service (auto-starts on first use)
brandos oracle start

# Stop service
brandos oracle stop

# Check status
brandos oracle status

# Reindex brand (rebuild embeddings)
brandos oracle reindex --brand "Revaa"

# Search directly
brandos oracle search "sustainable period care market size" --brand "Revaa"

# Ask with semantic search (automatic)
brandos ask "What's the market opportunity?" --brand "Revaa" --strategy precise
```

### Benefits

✅ **Semantic Understanding** - Find relevant info even with different wording
✅ **Fast Retrieval** - ChromaDB optimized for vector search
✅ **Accurate Results** - Two-stage retrieval improves precision
✅ **Context-Aware Answers** - LLM gets relevant document chunks
✅ **Scalable** - Can handle thousands of documents per brand
✅ **Per-Brand Isolation** - Each brand has own vector collection

### Implementation Effort

**Estimated Time**: 7-10 days
- Day 1-2: Python service setup, FastAPI endpoints
- Day 3-4: ChromaDB integration, embedding service
- Day 5-6: Chunking strategy, indexing pipeline
- Day 7: TypeScript client, CLI integration
- Day 8-9: Two-stage retrieval, reranking
- Day 10: Testing, optimization

**Dependencies**:
```txt
# requirements.txt
chromadb==0.4.18
sentence-transformers==2.2.2
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
nltk==3.8.1
```

---

## 3. Advanced Ingestion - PDF/DOCX Parsing

### Problem
Current ingestion is basic text extraction. Need:
- Proper PDF parsing (maintaining structure)
- DOCX parsing (styles, headings, tables)
- Preserve document structure (headings hierarchy)
- Extract tables and images
- Metadata extraction

### Solution Architecture

#### Tech Stack

- **PDF**: `pdf-parse` (Node.js) or `pdfplumber` (Python)
- **DOCX**: `mammoth` (Node.js) for clean HTML conversion
- **Tables**: `tabula-py` or custom extraction
- **OCR**: `tesseract` for scanned PDFs (optional)

#### Implementation

**Enhanced Ingestion Pipeline**:

```typescript
// src/ingestion/document-processor.ts
export class DocumentProcessor {
  private pdfParser: PDFParser;
  private docxParser: DOCXParser;
  private oracleClient: OracleClient;

  async processDocument(filePath: string, options: ProcessOptions): Promise<ProcessedDocument> {
    const ext = path.extname(filePath).toLowerCase();

    let processed: ProcessedDocument;

    switch (ext) {
      case '.pdf':
        processed = await this.pdfParser.parse(filePath);
        break;
      case '.docx':
        processed = await this.docxParser.parse(filePath);
        break;
      case '.md':
        processed = await this.markdownParser.parse(filePath);
        break;
      case '.txt':
        processed = await this.textParser.parse(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    // Extract metadata
    processed.metadata = {
      ...processed.metadata,
      fileName: path.basename(filePath),
      fileSize: (await fs.stat(filePath)).size,
      processedAt: new Date().toISOString(),
      sha256: await FileSystemUtils.calculateFileHash(filePath)
    };

    // Extract facts if enabled
    if (options.extractFacts) {
      const factExtractor = new FactExtractor();
      processed.facts = factExtractor.extractFacts(processed.text);
    }

    // Index in ORACLE if enabled
    if (options.index) {
      await this.oracleClient.indexDocument(options.brand, processed);
    }

    return processed;
  }
}

// src/ingestion/pdf-parser.ts
export class PDFParser {
  async parse(filePath: string): Promise<ProcessedDocument> {
    // Use pdf-parse for structure
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        title: data.info.Title,
        author: data.info.Author,
        creator: data.info.Creator,
        producer: data.info.Producer,
        creationDate: data.info.CreationDate
      },
      structure: {
        type: 'pdf',
        sections: this.extractSections(data.text),
        tables: await this.extractTables(filePath),
        images: await this.extractImages(filePath)
      }
    };
  }

  private extractSections(text: string): Section[] {
    // Detect headings by pattern (ALL CAPS, numbered, etc.)
    const sections: Section[] = [];
    const lines = text.split('\n');

    let currentSection: Section | null = null;

    for (const line of lines) {
      if (this.isHeading(line)) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          heading: line.trim(),
          content: [],
          level: this.detectHeadingLevel(line)
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }

    if (currentSection) sections.push(currentSection);

    return sections;
  }

  private isHeading(line: string): boolean {
    // Heuristics for heading detection
    const trimmed = line.trim();

    // ALL CAPS and short
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 100) return true;

    // Numbered (1. Introduction, 2.1 Methods)
    if (/^\d+(\.\d+)*\s+[A-Z]/.test(trimmed)) return true;

    // Roman numerals
    if (/^[IVX]+\.\s+[A-Z]/.test(trimmed)) return true;

    return false;
  }

  private async extractTables(filePath: string): Promise<Table[]> {
    // Use tabula-java for table extraction (requires Java)
    // Or use pdf-table-extractor
    // For now, return empty (can enhance later)
    return [];
  }

  private async extractImages(filePath: string): Promise<ImageInfo[]> {
    // Extract embedded images (optional)
    return [];
  }
}

// src/ingestion/docx-parser.ts
export class DOCXParser {
  async parse(filePath: string): Promise<ProcessedDocument> {
    // Use mammoth for clean conversion to HTML
    const result = await mammoth.convertToHtml(
      { path: filePath },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ]
      }
    );

    // Convert HTML to structured text
    const $ = cheerio.load(result.value);

    const sections: Section[] = [];
    let currentSection: Section | null = null;

    $('h1, h2, h3, p, table').each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim();

      if (tag.startsWith('h')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          heading: text,
          content: [],
          level: parseInt(tag[1])
        };
      } else if (tag === 'p' && currentSection) {
        currentSection.content.push(text);
      } else if (tag === 'table') {
        const table = this.parseTable($(el));
        if (currentSection) {
          currentSection.tables = currentSection.tables || [];
          currentSection.tables.push(table);
        }
      }
    });

    if (currentSection) sections.push(currentSection);

    // Get raw text
    const text = sections.map(s =>
      `${s.heading}\n${s.content.join('\n')}`
    ).join('\n\n');

    // Extract metadata from DOCX properties
    const metadata = await this.extractDocxMetadata(filePath);

    return {
      text,
      metadata,
      structure: {
        type: 'docx',
        sections,
        tables: sections.flatMap(s => s.tables || [])
      }
    };
  }

  private parseTable(tableEl: any): Table {
    const rows: string[][] = [];
    tableEl.find('tr').each((i, tr) => {
      const row: string[] = [];
      $(tr).find('td, th').each((j, cell) => {
        row.push($(cell).text().trim());
      });
      rows.push(row);
    });

    return {
      headers: rows[0] || [],
      rows: rows.slice(1),
      caption: tableEl.prev('p').text()
    };
  }

  private async extractDocxMetadata(filePath: string): Promise<DocumentMetadata> {
    // Use docx package to read core properties
    const doc = await readDocx(filePath);
    const props = doc.getCoreProperties();

    return {
      title: props.title,
      author: props.creator,
      subject: props.subject,
      keywords: props.keywords,
      description: props.description,
      lastModifiedBy: props.lastModifiedBy,
      created: props.created,
      modified: props.modified
    };
  }
}
```

#### Enhanced Ingest Command

```typescript
// src/cli/commands/ingest.ts (enhanced)
export async function ingestCommand(filePath: string, options: IngestOptions) {
  const spinner = ora('Processing document...').start();

  try {
    const processor = new DocumentProcessor();

    // Process document
    const processed = await processor.processDocument(filePath, {
      brand: options.brand,
      category: options.category,
      extractFacts: options.extract !== false,
      index: options.index !== false,
      preserveStructure: true
    });

    spinner.succeed('Document processed!');

    // Display summary
    console.log(chalk.bold('\nDocument Summary:'));
    console.log(chalk.cyan(`  Title: ${processed.metadata.title || 'Untitled'}`));
    console.log(chalk.cyan(`  Type: ${processed.structure.type.toUpperCase()}`));
    console.log(chalk.cyan(`  Pages/Sections: ${processed.structure.sections?.length || 'N/A'}`));
    console.log(chalk.cyan(`  Word Count: ${processed.text.split(/\s+/).length}`));

    if (processed.facts) {
      console.log(chalk.cyan(`  Facts Extracted: ${processed.facts.length}`));
      console.log(chalk.cyan(`  High Confidence: ${processed.facts.filter(f => f.confidence > 0.8).length}`));
    }

    if (processed.structure.tables) {
      console.log(chalk.cyan(`  Tables: ${processed.structure.tables.length}`));
    }

    // Save processed document
    const outputPath = `outputs/processed/${path.basename(filePath, path.extname(filePath))}.json`;
    await FileSystemUtils.writeJSON(outputPath, processed);

    console.log(chalk.green(`\n✓ Saved to: ${outputPath}`));

    if (options.index) {
      console.log(chalk.green('✓ Indexed in ORACLE'));
    }

  } catch (error) {
    spinner.fail('Document processing failed');
    logger.error('Ingest command failed', error);
    throw error;
  }
}
```

### Benefits

✅ **Structure Preservation** - Maintain document hierarchy
✅ **Table Extraction** - Parse and preserve tables
✅ **Metadata** - Extract author, date, title
✅ **Better Chunking** - Semantic sections for ORACLE
✅ **Fact Extraction** - Automatically extract claims
✅ **Multi-Format** - PDF, DOCX, MD, TXT

### Implementation Effort

**Estimated Time**: 4-5 days
- Day 1: PDF parser with structure extraction
- Day 2: DOCX parser with tables
- Day 3: Metadata extraction, enhanced ingest command
- Day 4: Integration with ORACLE, testing
- Day 5: Edge cases, optimization

**Dependencies**:
```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "cheerio": "^1.0.0-rc.12",
  "docx": "^8.5.0"
}
```

---

## 4. File Watchers - Auto-Processing

### Problem
Currently, files must be manually ingested. Need:
- Auto-detect new files in inputs/, resources/, documents/
- Automatically process and index them
- Re-process on file changes
- Batch processing for efficiency

### Solution Architecture

#### Implementation

```typescript
// src/daemon/file-watcher.ts
import chokidar from 'chokidar';

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private processor: DocumentProcessor;
  private queue: ProcessingQueue;
  private isRunning = false;

  constructor(private brand: string) {
    this.processor = new DocumentProcessor();
    this.queue = new ProcessingQueue();
  }

  start(): void {
    if (this.isRunning) {
      logger.warn('File watcher already running');
      return;
    }

    const watchPaths = [
      'inputs/**/*',
      'resources/**/*',
      'documents/**/*'
    ];

    logger.info('Starting file watcher', { paths: watchPaths });

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // Ignore hidden files
      persistent: true,
      ignoreInitial: false,     // Process existing files on start
      awaitWriteFinish: {       // Wait for file to finish writing
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', path => this.handleFileAdded(path))
      .on('change', path => this.handleFileChanged(path))
      .on('unlink', path => this.handleFileRemoved(path))
      .on('error', error => logger.error('Watcher error', error));

    this.isRunning = true;
    this.processQueue(); // Start queue processor
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isRunning = false;
    logger.info('File watcher stopped');
  }

  private async handleFileAdded(filePath: string): Promise<void> {
    logger.info('File added', { path: filePath });

    // Check if file type is supported
    if (!this.isSupportedFile(filePath)) {
      logger.debug('Skipping unsupported file', { path: filePath });
      return;
    }

    // Add to processing queue
    await this.queue.add({
      filePath,
      action: 'add',
      brand: this.brand,
      category: this.determineCategory(filePath)
    });
  }

  private async handleFileChanged(filePath: string): Promise<void> {
    logger.info('File changed', { path: filePath });

    if (!this.isSupportedFile(filePath)) return;

    // Check if file hash changed (avoid re-processing on metadata changes)
    const newHash = await FileSystemUtils.calculateFileHash(filePath);
    const existingFile = await this.findExistingFile(filePath);

    if (existingFile && existingFile.fingerprint.sha256 === newHash) {
      logger.debug('File content unchanged, skipping', { path: filePath });
      return;
    }

    await this.queue.add({
      filePath,
      action: 'update',
      brand: this.brand,
      category: this.determineCategory(filePath)
    });
  }

  private async handleFileRemoved(filePath: string): Promise<void> {
    logger.info('File removed', { path: filePath });

    // Remove from context manager
    const contextManager = new ContextManager(this.brand);
    await contextManager.removeFile(filePath);

    // TODO: Remove from ORACLE index
  }

  private async processQueue(): Promise<void> {
    while (this.isRunning) {
      const item = await this.queue.next();

      if (!item) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      try {
        await this.processFile(item);
        await this.queue.markComplete(item.id);
      } catch (error) {
        logger.error('Failed to process file', { item, error });
        await this.queue.markFailed(item.id, error);
      }
    }
  }

  private async processFile(item: ProcessingQueueItem): Promise<void> {
    logger.info('Processing file', { path: item.filePath, action: item.action });

    const processed = await this.processor.processDocument(item.filePath, {
      brand: item.brand,
      category: item.category,
      extractFacts: true,
      index: true,
      preserveStructure: true
    });

    // Update context manager
    const contextManager = new ContextManager(item.brand);
    await contextManager.addFile({
      path: item.filePath,
      category: item.category as any,
      subtype: 'document',
      format: path.extname(item.filePath).slice(1),
      fingerprint: {
        sha256: processed.metadata.sha256,
        size: processed.metadata.fileSize,
        mtime: new Date().toISOString()
      },
      metadata: processed.metadata,
      indexed: true
    });

    // Add extracted facts to knowledge
    if (processed.facts) {
      for (const fact of processed.facts) {
        await contextManager.addKnowledge({
          sourceFileId: processed.metadata.sha256,
          content: fact.sourceText,
          confidence: fact.confidence
        });
      }
    }

    logger.info('File processed successfully', { path: item.filePath });
  }

  private isSupportedFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.pdf', '.docx', '.doc', '.md', '.txt'].includes(ext);
  }

  private determineCategory(filePath: string): string {
    if (filePath.startsWith('inputs/')) return 'input';
    if (filePath.startsWith('resources/')) return 'resource';
    if (filePath.startsWith('documents/')) return 'document';
    return 'unknown';
  }

  private async findExistingFile(filePath: string): Promise<TrackedFile | null> {
    const contextManager = new ContextManager(this.brand);
    const state = await contextManager.getState();
    return state.files.find(f => f.path === filePath) || null;
  }
}

// src/daemon/processing-queue.ts
export class ProcessingQueue {
  private queue: ProcessingQueueItem[] = [];
  private processing = new Map<string, ProcessingQueueItem>();

  async add(item: Omit<ProcessingQueueItem, 'id' | 'status' | 'addedAt'>): Promise<void> {
    const queueItem: ProcessingQueueItem = {
      ...item,
      id: randomUUID(),
      status: 'pending',
      addedAt: new Date().toISOString()
    };

    this.queue.push(queueItem);
    logger.debug('Added to queue', { id: queueItem.id, path: item.filePath });
  }

  async next(): Promise<ProcessingQueueItem | null> {
    if (this.queue.length === 0) return null;

    const item = this.queue.shift()!;
    item.status = 'processing';
    item.startedAt = new Date().toISOString();
    this.processing.set(item.id, item);

    return item;
  }

  async markComplete(id: string): Promise<void> {
    const item = this.processing.get(id);
    if (item) {
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
      this.processing.delete(id);
      logger.info('Processing complete', { id, path: item.filePath });
    }
  }

  async markFailed(id: string, error: any): Promise<void> {
    const item = this.processing.get(id);
    if (item) {
      item.status = 'failed';
      item.error = error.message;
      item.completedAt = new Date().toISOString();
      this.processing.delete(id);
      logger.error('Processing failed', { id, path: item.filePath, error });
    }
  }

  getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      processing: this.processing.size,
      queue: this.queue,
      processing: Array.from(this.processing.values())
    };
  }
}
```

#### Daemon Service

```typescript
// src/daemon/index.ts
export class BrandBuilderDaemon {
  private watchers: Map<string, FileWatcher> = new Map();
  private isRunning = false;

  async start(brands?: string[]): Promise<void> {
    if (this.isRunning) {
      logger.warn('Daemon already running');
      return;
    }

    logger.info('Starting Brand Builder daemon...');

    // If no brands specified, watch all configured brands
    const brandsToWatch = brands || await this.getConfiguredBrands();

    for (const brand of brandsToWatch) {
      const watcher = new FileWatcher(brand);
      watcher.start();
      this.watchers.set(brand, watcher);
      logger.info('Watching brand', { brand });
    }

    this.isRunning = true;
    logger.info('Daemon started', { brands: brandsToWatch });

    // Keep process alive
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async stop(): Promise<void> {
    logger.info('Stopping daemon...');

    for (const [brand, watcher] of this.watchers) {
      watcher.stop();
      logger.info('Stopped watcher', { brand });
    }

    this.watchers.clear();
    this.isRunning = false;
    logger.info('Daemon stopped');
    process.exit(0);
  }

  async status(): Promise<DaemonStatus> {
    const statuses: Record<string, any> = {};

    for (const [brand, watcher] of this.watchers) {
      statuses[brand] = watcher.getStatus();
    }

    return {
      running: this.isRunning,
      brands: Array.from(this.watchers.keys()),
      watchers: statuses
    };
  }

  private async getConfiguredBrands(): Promise<string[]> {
    // Read all brand directories
    const brandosPath = FileSystemUtils.resolvePath('.brandos');
    const dirs = await fs.readdir(brandosPath, { withFileTypes: true });
    return dirs
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name);
  }
}
```

#### CLI Commands

```bash
# Start daemon for all brands
brandos daemon start

# Start for specific brand
brandos daemon start --brand "Revaa"

# Stop daemon
brandos daemon stop

# Check status
brandos daemon status

# View processing queue
brandos daemon queue

# Manual trigger (process all unprocessed files)
brandos daemon sync --brand "Revaa"
```

### Benefits

✅ **Auto-Processing** - No manual ingest commands needed
✅ **Real-time** - Files processed as soon as added
✅ **Change Detection** - Only re-process when content changes
✅ **Batch Efficiency** - Queue handles multiple files
✅ **Always Up-to-Date** - ORACLE index stays current
✅ **Background Operation** - Doesn't block CLI

### Implementation Effort

**Estimated Time**: 3-4 days
- Day 1: FileWatcher class, chokidar integration
- Day 2: ProcessingQueue, daemon service
- Day 3: CLI commands, testing
- Day 4: Edge cases, optimization

**Dependencies**:
```json
{
  "chokidar": "^3.5.3"
}
```

---

## Implementation Order & Timeline

### Recommended Sequence

**Week 1: Prompt Registry** (3-4 days)
- Foundational for all other features
- Improves prompt management immediately
- Low risk, high value

**Week 2-3: ORACLE Module** (7-10 days)
- Biggest feature, highest complexity
- Unblocks semantic search capabilities
- Core to "intelligence" value prop

**Week 3-4: Advanced Ingestion** (4-5 days)
- Feeds better data to ORACLE
- Can work in parallel with ORACLE testing
- Improves document processing quality

**Week 4: File Watchers** (3-4 days)
- Ties everything together
- Automates workflow
- Final UX enhancement

**Total Timeline**: 3-4 weeks focused development

---

## Testing Strategy

Since this is for internal use only:

**Focus On:**
✅ Core functionality works correctly
✅ Happy path testing
✅ Basic error handling
✅ Manual testing with real documents

**Skip:**
❌ Extensive edge case testing
❌ Load testing / performance optimization
❌ Security hardening
❌ Multi-user scenarios
❌ Cross-platform testing (just your machine)

**Testing Checklist**:
- [ ] Prompt registry can create/update/rollback prompts
- [ ] ORACLE semantic search returns relevant results
- [ ] PDF/DOCX parsing preserves structure
- [ ] File watcher detects and processes new files
- [ ] All features work together (end-to-end)
- [ ] Real brand test (Revaa with actual documents)

---

## Success Criteria

**v2.0.0 is successful if:**

1. ✅ You can drop a PDF into inputs/ and it auto-processes
2. ✅ Asking questions returns semantically relevant answers from documents
3. ✅ Prompts are version-controlled and reproducible
4. ✅ All 4 features work together smoothly
5. ✅ The tool feels "intelligent" and "powerful"
6. ✅ You want to use it for real brand work

---

## Next Steps

**Ready to start?** Let me know and I'll:

1. Create the first feature (Prompt Registry) with full implementation
2. Set up the Python ORACLE service
3. Build the enhanced ingestion pipeline
4. Wire up file watchers

**Or would you like me to:**
- Refine any of these designs first?
- Create detailed API specs?
- Start with a specific feature?

---

**Document Version**: 1.0.0
**Status**: Planning Complete, Ready for Implementation
**Next Review**: After each feature completion
