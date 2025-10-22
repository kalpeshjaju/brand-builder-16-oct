/**
 * FILE PURPOSE: HTML Parser for extracting text content from HTML files
 *
 * CONTEXT: Enables ingestion of HTML brand documents (reports, presentations, etc.)
 * into ChromaDB for semantic search and AI-powered editing. Extracts clean text while
 * preserving semantic structure (headings, paragraphs, lists).
 *
 * DEPENDENCIES: cheerio (HTML parsing), fs/promises (file reading)
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-10-22
 */

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import { readFile } from 'fs/promises';
import * as cheerio from 'cheerio';

export class HTMLParser implements Parser {
  name = 'HTMLParser';
  supportedFormats: FileFormat[] = ['html'];

  /**
   * Parse HTML file and extract structured content
   *
   * WHY: HTML files contain brand documents that need to be indexed for semantic search
   * HOW: Use Cheerio to parse HTML, extract text, preserve semantic structure
   *
   * @param {string} filePath - Path to HTML file
   * @param {ParserConfig} config - Optional parser configuration
   * @returns {ProcessedContent} Structured content with raw, structured, and cleaned text
   *
   * EXAMPLE:
   * ```typescript
   * const parser = new HTMLParser();
   * const content = await parser.parse('flyberry-act1.html');
   * // content.cleaned = "Brand North Star\n\nWe believe in..."
   * ```
   *
   * EDGE CASES:
   * - Handles <script> and <style> tags (removes them)
   * - Preserves semantic structure via headings
   * - Normalizes whitespace and line breaks
   * - Handles malformed HTML gracefully
   */
  async parse(filePath: string, config?: ParserConfig): Promise<ProcessedContent> {
    try {
      // STEP 1: Read HTML file
      const raw = await readFile(filePath, 'utf-8');

      // STEP 2: Load HTML with Cheerio
      const $ = cheerio.load(raw);

      // STEP 3: Remove script and style tags (not useful for text extraction)
      $('script, style, noscript').remove();

      // STEP 4: Extract structured content
      const sections = this.extractSections($);
      const headings = this.extractHeadings($);
      const htmlMetadata = this.extractMetadata($);

      // STEP 5: Extract clean text
      const cleaned = this.cleanText($, config);

      // STEP 6: Build processed content
      const processed: ProcessedContent = {
        raw,
        structured: {
          sections,
          headings,
          metadata: htmlMetadata,
        },
        cleaned,
      };

      return processed;
    } catch (error) {
      throw new Error(
        `Failed to parse HTML file at ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the file exists and is valid HTML.`
      );
    }
  }

  /**
   * Extract sections from HTML (by headings)
   *
   * WHY: Sections provide semantic structure for better chunking
   * HOW: Find all h1-h6 tags, extract following content until next heading
   */
  private extractSections($: cheerio.Root): string[] {
    const sections: string[] = [];

    // Find all heading tags
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $heading = $(element);
      const headingText = $heading.text().trim();

      // Get all siblings until next heading
      const contentElements: string[] = [];
      let $next = $heading.next();

      while ($next.length && !$next.is('h1, h2, h3, h4, h5, h6')) {
        const text = $next.text().trim();
        if (text) {
          contentElements.push(text);
        }
        $next = $next.next();
      }

      // Combine heading + content
      if (headingText || contentElements.length > 0) {
        const sectionText = headingText
          ? `${headingText}\n\n${contentElements.join('\n\n')}`
          : contentElements.join('\n\n');
        sections.push(sectionText);
      }
    });

    return sections;
  }

  /**
   * Extract all headings from HTML
   *
   * WHY: Headings provide document structure and navigation
   * HOW: Extract text from all h1-h6 tags
   */
  private extractHeadings($: cheerio.Root): string[] {
    const headings: string[] = [];

    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        headings.push(text);
      }
    });

    return headings;
  }

  /**
   * Extract metadata from HTML head
   *
   * WHY: Metadata provides context (title, description, author, etc.)
   * HOW: Parse <title>, <meta> tags in <head>
   */
  private extractMetadata($: cheerio.Root): Record<string, string> {
    const metadata: Record<string, string> = {};

    // Extract title
    const title = $('title').text().trim();
    if (title) {
      metadata['title'] = title;
    }

    // Extract meta tags
    $('meta').each((_, element) => {
      const $meta = $(element);
      const name = $meta.attr('name') || $meta.attr('property');
      const content = $meta.attr('content');

      if (name && content) {
        metadata[name] = content;
      }
    });

    return metadata;
  }

  /**
   * Clean and normalize HTML text
   *
   * WHY: Remove HTML artifacts, normalize whitespace for clean text
   * HOW: Extract text, remove excess whitespace, preserve paragraphs
   *
   * PERFORMANCE: O(n) where n is HTML size
   */
  private cleanText($: cheerio.Root, config?: ParserConfig): string {
    let cleaned: string;

    if (config?.preserveFormatting) {
      // PRESERVE: Keep HTML structure
      cleaned = $('body').html() || '';
    } else {
      // EXTRACT: Get clean text from body
      cleaned = $('body').text();

      // STEP 1: Normalize whitespace
      cleaned = cleaned.replace(/\s+/g, ' '); // Multiple spaces → single space
      cleaned = cleaned.replace(/\n\s*\n/g, '\n\n'); // Multiple line breaks → double

      // STEP 2: Remove leading/trailing whitespace per line
      cleaned = cleaned
        .split('\n')
        .map(line => line.trim())
        .join('\n');

      // STEP 3: Remove excessive line breaks (more than 2)
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    }

    return cleaned.trim();
  }

  /**
   * Chunk large HTML content for ChromaDB indexing
   *
   * WHY: Large HTML files (100 pages, 30k+ characters) exceed embedding limits
   * HOW: Split by sections (headings), then by character limit if needed
   *
   * @param {string} content - Full HTML text content
   * @param {number} chunkSize - Max characters per chunk (default: 2000)
   * @param {number} overlap - Overlap between chunks for context (default: 200)
   * @returns {string[]} Array of text chunks
   *
   * EXAMPLE:
   * ```typescript
   * const chunks = parser.chunkContent(longHtmlText, 2000, 200);
   * // chunks = ["Section 1 text...", "Section 2 text...", ...]
   * ```
   *
   * EDGE CASES:
   * - Single section > chunkSize: Split mid-section with overlap
   * - Empty sections: Skip
   * - Very small chunks: Merge with previous
   */
  chunkContent(content: string, chunkSize = 2000, overlap = 200): string[] {
    const chunks: string[] = [];

    // STEP 1: Split by sections (double line break = section boundary)
    const sections = content.split(/\n\n+/).filter(s => s.trim().length > 0);

    let currentChunk = '';

    for (const section of sections) {
      const sectionText = section.trim();

      // CASE 1: Section fits in current chunk
      if ((currentChunk + '\n\n' + sectionText).length <= chunkSize) {
        currentChunk = currentChunk
          ? currentChunk + '\n\n' + sectionText
          : sectionText;
      }
      // CASE 2: Current chunk is full, start new chunk
      else if (currentChunk.length > 0) {
        chunks.push(currentChunk);

        // Start new chunk with overlap from previous chunk
        const overlapText = currentChunk.slice(-overlap) || '';
        currentChunk = overlapText + '\n\n' + sectionText;
      }
      // CASE 3: Section itself is too large, split it
      else if (sectionText.length > chunkSize) {
        const subChunks = this.splitLargeSection(sectionText, chunkSize, overlap);
        chunks.push(...subChunks.slice(0, -1)); // Add all but last
        currentChunk = subChunks[subChunks.length - 1] || ''; // Keep last as current
      }
      // CASE 4: Start fresh with this section
      else {
        currentChunk = sectionText;
      }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Split a large section that exceeds chunk size
   *
   * WHY: Some sections (long paragraphs) exceed max chunk size
   * HOW: Split by sentences, then by character limit with overlap
   */
  private splitLargeSection(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length <= chunkSize) {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      } else {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + ' ' + sentence;
        } else {
          // Single sentence exceeds chunk size - force split
          chunks.push(sentence.slice(0, chunkSize));
          currentChunk = sentence.slice(chunkSize - overlap);
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}
