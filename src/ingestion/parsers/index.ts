// Parser exports

export { PDFParser } from './pdf-parser.js';
export { DOCXParser } from './docx-parser.js';
export { TextParser } from './text-parser.js';
export { ReviewsParser } from './reviews-parser.js';
export { TablesParser } from './tables-parser.js';

// Parser registry for easy access
import { PDFParser } from './pdf-parser.js';
import { DOCXParser } from './docx-parser.js';
import { TextParser } from './text-parser.js';
import { ReviewsParser } from './reviews-parser.js';
import { TablesParser } from './tables-parser.js';
import type { Parser } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';

/**
 * Get parser for a specific file format
 */
export function getParser(format: FileFormat): Parser | null {
  switch (format) {
    case 'pdf':
      return new PDFParser();
    case 'docx':
      return new DOCXParser();
    case 'txt':
    case 'md':
      return new TextParser();
    case 'json':
      return new ReviewsParser();
    case 'csv':
      return new TablesParser();
    default:
      return null;
  }
}

/**
 * Get all available parsers
 */
export function getAllParsers(): Parser[] {
  return [
    new PDFParser(),
    new DOCXParser(),
    new TextParser(),
    new ReviewsParser(),
    new TablesParser(),
  ];
}

/**
 * Check if format is supported
 */
export function isFormatSupported(format: FileFormat): boolean {
  return getParser(format) !== null;
}
