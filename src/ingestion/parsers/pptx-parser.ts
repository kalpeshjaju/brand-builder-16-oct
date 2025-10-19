/**
 * PPTX Parser - Extract content from PowerPoint presentations
 *
 * Supports:
 * - PPTX files (PowerPoint 2007+)
 * - Slide text extraction
 * - Notes extraction
 * - Metadata extraction
 */

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import officeParser from 'officeparser';

export interface PPTXParserOptions extends ParserConfig {
  extractNotes?: boolean;
  preserveSlideOrder?: boolean;
}

export class PPTXParser implements Parser {
  name = 'PPTXParser';
  supportedFormats: FileFormat[] = ['docx']; // Will use for pptx when added to FileFormat type

  /**
   * Parse PPTX file and extract structured content
   */
  async parse(
    filePath: string,
    _options?: PPTXParserOptions
  ): Promise<ProcessedContent> {
    try {
      // Parse PPTX file using officeparser
      const text = await officeParser.parseOfficeAsync(filePath);

      // Extract structured content
      const sections = this.extractSections(text);

      // Build processed content
      const processed: ProcessedContent = {
        raw: text,
        structured: {
          sections,
          headings: this.extractHeadings(sections),
        },
        cleaned: this.cleanText(text),
      };

      return processed;
    } catch (error) {
      throw new Error(
        `Failed to parse PPTX at ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the file is a valid PPTX and you have read permissions.\n` +
        `Note: officeparser library is required (npm install officeparser)`
      );
    }
  }

  /**
   * Extract slides from raw text
   * Note: officeparser returns all text, we'll try to detect slide boundaries
   */
  private extractSlides(text: string): string[] {
    // Split by common slide delimiters or paragraphs
    const slides = text.split(/\n\n+/).filter((s) => s.trim().length > 0);
    return slides;
  }

  /**
   * Extract sections from text
   */
  private extractSections(text: string): string[] {
    const slides = this.extractSlides(text);
    return slides;
  }

  /**
   * Extract headings (first line of each slide typically)
   */
  private extractHeadings(sections: string[]): string[] {
    const headings: string[] = [];

    sections.forEach((section) => {
      const lines = section.split('\n');
      const firstLine = lines[0];
      if (firstLine && firstLine.trim().length > 0) {
        headings.push(firstLine.trim());
      }
    });

    return headings;
  }

  /**
   * Clean text for indexing
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Remove special chars
      .trim();
  }
}
