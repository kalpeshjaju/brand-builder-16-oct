# ChromaDB Management Commands

**Purpose**: Direct management of ChromaDB vector store for data correction and maintenance.

**Added**: 2025-10-22
**Version**: 1.2.0

---

## Overview

ChromaDB stores indexed brand knowledge as vector embeddings for semantic search. These commands allow you to:
- **Update** incorrect or outdated documents
- **Delete** bad data from the knowledge base
- **List** what's currently indexed

## Why This Matters

**Problem**: If wrong data is indexed (e.g., fabricated competitors, incorrect stats), AI will use that wrong data and produce incorrect outputs.

**Solution**: These commands let you correct indexed data without re-ingesting everything.

---

## Commands

### 1. List Documents

View all documents currently in ChromaDB:

```bash
npm run dev chroma list -- --limit 10
```

**Options**:
- `--limit <number>` - Maximum documents to show (default: 10)

**Output**:
```
📚 Documents in ChromaDB:

1. ID: competitor-acme-2025-10-15
   Text: Acme Corp is a leading provider of...
   Metadata: {"source":"web","brand":"MyBrand"}

2. ID: market-research-2025-10-15
   Text: Market analysis shows...
   Metadata: {"source":"pdf","brand":"MyBrand"}
```

**Use Case**:
- Audit what's indexed
- Find document IDs for update/delete

---

### 2. Update Document

Replace an existing document with corrected content:

```bash
npm run dev chroma update -- \
  --id "competitor-acme-2025-10-15" \
  --document "Corrected text about Acme Corp..." \
  --metadata '{"source":"manual","corrected":true}'
```

**Required Options**:
- `--id <id>` - Document ID to update
- `--document <text>` - New document text

**Optional**:
- `--metadata <json>` - New metadata (JSON string)

**Output**:
```
✔ Document updated: competitor-acme-2025-10-15
```

**Use Case**:
- Fix incorrect competitor data
- Update outdated information
- Correct fabricated stats

---

### 3. Delete Document

Remove a document completely:

```bash
npm run dev chroma delete -- --id "competitor-acme-2025-10-15"
```

**Required Options**:
- `--id <id>` - Document ID to delete

**Output**:
```
✔ Document deleted: competitor-acme-2025-10-15
```

**Use Case**:
- Remove completely wrong data
- Clean up test documents
- Delete duplicates

---

## Workflow: Correcting Bad Data

### Scenario: Indexed wrong competitor data

**Step 1: Identify the problem**
```bash
# Search shows bad data
npm run dev chroma list -- --limit 20
# Find: ID "competitor-badco-2025-10-15" has wrong info
```

**Step 2: Delete bad document**
```bash
npm run dev chroma delete -- --id "competitor-badco-2025-10-15"
```

**Step 3: Re-index correct data**
```bash
npm run dev ingest -- --file correct-competitor-data.pdf --brand MyBrand
```

**Step 4: Verify**
```bash
npm run dev chroma list -- --limit 5
```

---

## Best Practices

### Prevention (Better than Correction)

1. **Validate before indexing** - QA source documents first
2. **Use versioned IDs** - Format: `doc-name-YYYY-MM-DD-v2`
3. **Store source metadata** - Track where data came from
4. **Regular audits** - Review indexed data monthly

### Detection

1. **Use contradiction detector** - Your 8-layer validation system can flag bad data
2. **Cross-check sources** - Verify against original documents
3. **User feedback** - Allow "mark as incorrect" feature

### Correction

1. **Delete immediately** - Don't let bad data linger
2. **Version increment** - Use v2, v3 when re-indexing
3. **Log changes** - Document what was wrong and why

---

## ID Naming Convention

**Recommended format**: `{category}-{name}-{date}-{version}`

**Examples**:
```
competitor-acme-2025-10-15-v1
market-research-2025-10-15-v1
brand-analysis-2025-10-15-v2  (corrected version)
```

**Benefits**:
- Easy to identify what document contains
- Track versions of same document
- Sort by date

---

## Technical Details

### Architecture

```
CLI Command (TypeScript)
    ↓
OracleClient (oracle-client.ts)
    ↓
PythonBridge (spawns child process)
    ↓
oracle_bridge.py (Python)
    ↓
ChromaDB (vector database)
```

### Files Modified

- **Python**: `src/oracle/oracle_bridge.py` (added update/delete/list functions)
- **TypeScript**: `src/oracle/oracle-client.ts` (added updateDocument/deleteDocument/listDocuments methods)
- **CLI**: `src/cli/commands/chroma.ts` (new command file)
- **CLI**: `src/cli/index.ts` (registered chroma commands)

### Storage Location

ChromaDB data is stored in: `./.brandos/chroma/`

---

## Troubleshooting

### Error: "Failed to connect to Python bridge"

**Cause**: ChromaDB Python environment not set up

**Fix**:
```bash
cd src/oracle
pip3 install -r requirements.txt
```

### Error: "Document not found"

**Cause**: Invalid document ID

**Fix**: Run `chroma list` to see valid IDs

### Warning: "urllib3 v2 only supports OpenSSL 1.1.1+"

**Cause**: Python SSL library version mismatch

**Fix**: Safe to ignore - doesn't affect functionality

---

## Integration with Validation System

These commands complement your existing 8-layer validation system:

**Layer 1-2**: Detect bad data during analysis
**Layer 3-8**: Verify quality before indexing
**ChromaDB Commands**: Fix issues after indexing

**Workflow**:
```
Analysis → Validation → Indexing → [Issue Found] → ChromaDB Commands → Fix → Re-validate
```

---

## Examples

### Example 1: Update competitor info

```bash
# Found wrong competitor pricing
npm run dev chroma update -- \
  --id "competitor-acme-pricing-2025-10-15" \
  --document "Acme pricing: Enterprise $299/mo (verified from their website)" \
  --metadata '{"source":"acme.com/pricing","verified":"2025-10-22"}'
```

### Example 2: Delete hallucinated competitor

```bash
# AI invented "FreshBerry" competitor that doesn't exist
npm run dev chroma delete -- --id "competitor-freshberry-2025-10-15"
```

### Example 3: Audit indexed data

```bash
# Review all indexed competitors
npm run dev chroma list -- --limit 50 | grep "competitor-"
```

---

## Future Enhancements

Potential additions:

- [ ] Bulk operations (update/delete multiple docs)
- [ ] Search within ChromaDB (by metadata filters)
- [ ] Export/import ChromaDB collections
- [ ] Backup/restore functionality
- [ ] Document version history tracking

---

## Related Commands

- `npm run dev ingest` - Index new documents
- `npm run dev oracle search` - Search indexed documents (via oracle-service)
- `npm run dev context status` - View context state

---

## HTML File Support (NEW!)

**Added**: 2025-10-22

### Ingest Large HTML Files

The system now supports **HTML files with automatic chunking** for large documents (100+ pages):

```bash
# Ingest HTML file with automatic chunking
npm run dev ingest -- \
  --file flyberry-act1.html \
  --brand Flyberry \
  --chunk-size 2000 \
  --chunk-overlap 200
```

**Features**:
- ✅ **Auto-chunking**: Large files split into manageable chunks (default: 2000 chars)
- ✅ **Smart splitting**: Preserves sections, splits by headings then sentences
- ✅ **Overlap**: 200-char overlap between chunks for context continuity
- ✅ **Metadata extraction**: Extracts title, meta tags from HTML
- ✅ **Clean text**: Removes scripts, styles, preserves content

**Example Output**:
```
✔ Document ingested successfully!

📄 Ingestion Summary:

  File: flyberry-act1-v2-final-2025-10-15.html
  Type: HTML
  Brand: Flyberry
  Chunks: 15
  Total Characters: 28,547

📋 Document IDs (first 3):

  - flyberry-act1-v2-final-2025-10-15.html-chunk-1-a3b4c5d6
  - flyberry-act1-v2-final-2025-10-15.html-chunk-2-e7f8g9h0
  - flyberry-act1-v2-final-2025-10-15.html-chunk-3-i1j2k3l4
  ... and 12 more

✅ Ready for semantic search!
```

### How Chunking Works

**For 100-page HTML (30,000+ characters)**:

1. **Parse HTML** - Extract clean text, preserve structure
2. **Split by sections** - Using headings (h1-h6) as boundaries
3. **Split large sections** - If section > chunk_size, split by sentences
4. **Add overlap** - 200 chars from end of previous chunk
5. **Index all chunks** - Each gets unique ID with metadata

**Benefits**:
- ✅ No embedding size limit errors
- ✅ Better semantic search (smaller, focused chunks)
- ✅ Context preserved (overlaps maintain continuity)
- ✅ Easy editing (update specific chunks, not whole file)

### Workflow: Ingest → Query → Edit

```bash
# 1. Ingest large HTML file
npm run dev ingest -- --file brand-package.html --brand MyBrand

# 2. List what was indexed
npm run dev chroma list -- --limit 20

# 3. Find chunk with wrong data
# ID: brand-package.html-chunk-8-xyz123

# 4. Update that chunk
npm run dev chroma update -- \
  --id "brand-package.html-chunk-8-xyz123" \
  --document "Corrected section 8 text..." \
  --metadata '{"corrected":true,"section":8}'

# 5. Verify
npm run dev chroma list -- --limit 20
```

### Supported File Types

| Format | Extension | Chunking | Status |
|--------|-----------|----------|--------|
| HTML | `.html` | ✅ Automatic | ✅ Production |
| PDF | `.pdf` | ❌ Manual | ✅ Production |
| DOCX | `.docx` | ❌ Manual | ✅ Production |
| Markdown | `.md` | ❌ Manual | ✅ Production |
| Text | `.txt` | ❌ Manual | ✅ Production |

**Note**: Only HTML parser currently has automatic chunking. Other formats may be added in future versions.

---

**Last Updated**: 2025-10-22
**Version**: 1.2.1 (HTML Support)
**Status**: ✅ Production Ready
