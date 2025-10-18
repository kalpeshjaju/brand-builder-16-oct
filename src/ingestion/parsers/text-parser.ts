// Text/Markdown Parser - Extract content from plain text files

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import { readFile } from 'fs/promises';

export class TextParser implements Parser {
  name = 'TextParser';
  supportedFormats: FileFormat[] = ['txt', 'md'];

  /**
   * Parse text/markdown file and extract structured content
   */
  async parse(filePath: string, config?: ParserConfig): Promise<ProcessedContent> {
    try {
      // Read file
      const raw = await readFile(filePath, 'utf-8');

      // Extract sections (by double line break)
      const sections = this.extractSections(raw);

      // Extract headings (markdown format)
      const headings = this.extractHeadings(raw);

      // Build processed content
      const processed: ProcessedContent = {
        raw,
        structured: {
          sections,
          headings,
        },
        cleaned: this.cleanText(raw, config),
      };

      return processed;
    } catch (error) {
      throw new Error(
        `Failed to parse text file at ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the file exists and you have read permissions.`
      );
    }
  }

  /**
   * Extract sections from text
   */
  private extractSections(text: string): string[] {
    // Split by markdown headers or double line breaks
    const sections = text
      .split(/\n(?=#{1,6}\s|\n)/)
      .map(section => section.trim())
      .filter(section => section.length > 0);

    return sections;
  }

  /**
   * Extract markdown headings
   */
  private extractHeadings(text: string): string[] {
    const headings: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Match markdown headings (# Heading)
      const match = line.match(/^#{1,6}\s+(.+)$/);
      if (match && match[1]) {
        headings.push(match[1].trim());
      }
    }

    return headings;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string, config?: ParserConfig): string {
    let cleaned = text;

    if (!config?.preserveFormatting) {
      // Remove markdown syntax
      cleaned = cleaned.replace(/#{1,6}\s+/g, ''); // Headers
      cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold
      cleaned = cleaned.replace(/\*(.+?)\*/g, '$1'); // Italic
      cleaned = cleaned.replace(/`(.+?)`/g, '$1'); // Code
      cleaned = cleaned.replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Links

      // Normalize whitespace
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      cleaned = cleaned.replace(/\s+$/gm, ''); // Trailing spaces
    }

    return cleaned.trim();
  }
}
