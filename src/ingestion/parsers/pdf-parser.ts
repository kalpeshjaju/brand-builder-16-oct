// PDF Parser - Extract content from PDF files

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import { PDFParse } from 'pdf-parse';
import { readFile } from 'fs/promises';

export class PDFParser implements Parser {
  name = 'PDFParser';
  supportedFormats: FileFormat[] = ['pdf'];

  /**
   * Parse PDF file and extract structured content
   */
  async parse(filePath: string, config?: ParserConfig): Promise<ProcessedContent> {
    // Read PDF file
    const dataBuffer = await readFile(filePath);

    // Parse PDF
    const parser = new PDFParse({ data: dataBuffer });

    try {
      const result = await parser.getText();

      // Extract text
      const data = { text: result.text, numpages: result.pages };

      // Extract structured content
      const sections = this.extractSections(data.text);
      const tables = config?.extractTables ? this.extractTables(data.text) : [];

      // Build processed content
      const processed: ProcessedContent = {
        raw: data.text,
        structured: {
          sections,
          headings: this.extractHeadings(data.text),
          tables: tables.length > 0 ? tables : undefined,
        },
        cleaned: this.cleanText(data.text, config),
      };

      return processed;
    } catch (error) {
      throw new Error(
        `Failed to parse PDF at ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the file is a valid PDF and you have read permissions.`
      );
    } finally {
      // Clean up parser resources
      await parser.destroy();
    }
  }

  /**
   * Extract sections from text based on line breaks and spacing
   */
  private extractSections(text: string): string[] {
    // Split by double line breaks (common section delimiter)
    const sections = text
      .split(/\n\s*\n/)
      .map(section => section.trim())
      .filter(section => section.length > 0);

    return sections;
  }

  /**
   * Extract headings (lines that are short, capitalized, or followed by content)
   */
  private extractHeadings(text: string): string[] {
    const lines = text.split('\n');
    const headings: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();

      // Skip empty lines
      if (!line) continue;

      // Potential heading characteristics:
      // 1. Short line (< 80 chars)
      // 2. Followed by longer content
      // 3. All caps or title case
      // 4. Ends without punctuation
      const isShort = line.length < 80;
      const hasNextLine = i < lines.length - 1;
      const nextLineIsLonger = hasNextLine && (lines[i + 1]?.trim().length || 0) > line.length;
      const isAllCaps = line === line.toUpperCase() && line.match(/[A-Z]/);
      const endsWithoutPunctuation = !line.match(/[.!?]$/);

      if (isShort && (isAllCaps || (nextLineIsLonger && endsWithoutPunctuation))) {
        headings.push(line);
      }
    }

    return headings;
  }

  /**
   * Extract tables (basic heuristic - looks for aligned columns)
   */
  private extractTables(text: string): Array<{ raw: string }> {
    const tables: Array<{ raw: string }> = [];
    const lines = text.split('\n');

    let currentTable: string[] = [];
    let inTable = false;

    for (const line of lines) {
      // Detect table rows (multiple spaces or tabs indicating columns)
      const hasMultipleSpaces = line.match(/\s{2,}/g);
      const hasTabs = line.includes('\t');

      if (hasMultipleSpaces || hasTabs) {
        inTable = true;
        currentTable.push(line);
      } else if (inTable && line.trim() === '') {
        // End of table (empty line)
        if (currentTable.length > 0) {
          tables.push({ raw: currentTable.join('\n') });
          currentTable = [];
        }
        inTable = false;
      } else if (inTable) {
        // Single line between table rows - include it
        currentTable.push(line);
      }
    }

    // Add final table if exists
    if (currentTable.length > 0) {
      tables.push({ raw: currentTable.join('\n') });
    }

    return tables;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string, config?: ParserConfig): string {
    let cleaned = text;

    if (!config?.preserveFormatting) {
      // Remove excessive whitespace
      cleaned = cleaned.replace(/\s+/g, ' ');

      // Normalize line breaks
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

      // Remove common PDF artifacts
      cleaned = cleaned.replace(/\f/g, ''); // Form feed
      cleaned = cleaned.replace(/\r/g, ''); // Carriage return
    }

    return cleaned.trim();
  }
}
