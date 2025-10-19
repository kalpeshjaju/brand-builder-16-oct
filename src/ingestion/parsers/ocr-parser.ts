/**
 * OCR Parser - Extract text from images using Tesseract.js
 *
 * Supports:
 * - PNG, JPG, JPEG, BMP, GIF, TIFF images
 * - Multi-language OCR (default: English)
 * - Confidence scoring
 * - Text region detection
 */

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import Tesseract from 'tesseract.js';

export interface OCRParserOptions extends ParserConfig {
  language?: string; // Default: 'eng' (English)
  minConfidence?: number; // Default: 0 (accept all)
  detectRegions?: boolean; // Default: false
}

export class OCRParser implements Parser {
  name = 'OCRParser';
  supportedFormats: FileFormat[] = ['unknown']; // Will use for image formats when added

  /**
   * Parse image file and extract text using OCR
   */
  async parse(
    filePath: string,
    options?: OCRParserOptions
  ): Promise<ProcessedContent> {
    const language = options?.language || 'eng';
    const minConfidence = options?.minConfidence ?? 0;

    try {
      // Perform OCR using Tesseract.js
      const result = await Tesseract.recognize(filePath, language, {
        logger: (m) => {
          // Optional: log progress
          if (m.status === 'recognizing text') {
            // Progress: m.progress
          }
        },
      });

      // Extract text and confidence
      const { text, confidence } = result.data;

      // Filter by confidence if specified
      let cleanedText = text;
      if (minConfidence > 0 && confidence < minConfidence) {
        cleanedText = '';
      }

      // Extract structured content
      const paragraphs = this.extractParagraphs(text);

      // Build processed content
      const processed: ProcessedContent = {
        raw: text,
        structured: {
          sections: paragraphs,
        },
        cleaned: this.cleanText(cleanedText),
      };

      return processed;
    } catch (error) {
      throw new Error(
        `Failed to perform OCR on ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the file is a valid image (PNG, JPG, etc.) and tesseract.js is installed.\n` +
        `Note: For better accuracy, use high-resolution images with clear text.`
      );
    }
  }

  /**
   * Extract lines from Tesseract result
   * Note: Tesseract.Page may not have lines property in all versions
   */
  // private extractLines(data: Tesseract.Page): string[] {
  //   const lines: string[] = [];
  //   if ((data as any).lines) {
  //     (data as any).lines.forEach((line: any) => {
  //       if (line.text && line.text.trim().length > 0) {
  //         lines.push(line.text.trim());
  //       }
  //     });
  //   }
  //   return lines;
  // }

  /**
   * Extract paragraphs from text
   */
  private extractParagraphs(text: string): string[] {
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    return paragraphs;
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

  /**
   * Get supported image formats
   */
  static getSupportedFormats(): string[] {
    return ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'webp'];
  }
}
