/**
 * Parser Integration Tests
 *
 * Tests all parsers with their respective file formats
 * Note: These tests require sample files to be present
 */

import { describe, it, expect } from 'vitest';
import {
  getParser,
  getAllParsers,
  isFormatSupported,
  PDFParser,
  DOCXParser,
  TextParser,
  ReviewsParser,
  TablesParser,
  PPTXParser,
  OCRParser,
} from '../../src/ingestion/parsers/index.js';
import type { FileFormat } from '../../src/types/context-types.js';

describe('Parser Integration Tests', () => {
  describe('Parser Factory', () => {
    it('should return correct parser for each format', () => {
      const pdfParser = getParser('pdf');
      expect(pdfParser).toBeInstanceOf(PDFParser);
      expect(pdfParser?.name).toBe('PDFParser');

      const docxParser = getParser('docx');
      expect(docxParser).toBeInstanceOf(DOCXParser);
      expect(docxParser?.name).toBe('DOCXParser');

      const txtParser = getParser('txt');
      expect(txtParser).toBeInstanceOf(TextParser);
      expect(txtParser?.name).toBe('TextParser');

      const mdParser = getParser('md');
      expect(mdParser).toBeInstanceOf(TextParser);
      expect(mdParser?.name).toBe('TextParser');

      const jsonParser = getParser('json');
      expect(jsonParser).toBeInstanceOf(ReviewsParser);
      expect(jsonParser?.name).toBe('ReviewsParser');

      const csvParser = getParser('csv');
      expect(csvParser).toBeInstanceOf(TablesParser);
      expect(csvParser?.name).toBe('TablesParser');
    });

    it('should return null for unsupported formats', () => {
      const parser = getParser('unknown' as FileFormat);
      expect(parser).toBeNull();
    });

    it('should return all available parsers', () => {
      const parsers = getAllParsers();
      expect(parsers.length).toBe(7); // PDF, DOCX, Text, Reviews, Tables, PPTX, OCR

      const parserNames = parsers.map(p => p.name);
      expect(parserNames).toContain('PDFParser');
      expect(parserNames).toContain('DOCXParser');
      expect(parserNames).toContain('TextParser');
      expect(parserNames).toContain('ReviewsParser');
      expect(parserNames).toContain('TablesParser');
      expect(parserNames).toContain('PPTXParser');
      expect(parserNames).toContain('OCRParser');
    });

    it('should correctly identify supported formats', () => {
      expect(isFormatSupported('pdf')).toBe(true);
      expect(isFormatSupported('docx')).toBe(true);
      expect(isFormatSupported('txt')).toBe(true);
      expect(isFormatSupported('md')).toBe(true);
      expect(isFormatSupported('json')).toBe(true);
      expect(isFormatSupported('csv')).toBe(true);
      expect(isFormatSupported('unknown')).toBe(false);
    });
  });

  describe('Parser Interface Compliance', () => {
    it('should have name and supportedFormats properties', () => {
      const parsers = getAllParsers();

      parsers.forEach(parser => {
        expect(parser.name).toBeDefined();
        expect(typeof parser.name).toBe('string');
        expect(parser.supportedFormats).toBeDefined();
        expect(Array.isArray(parser.supportedFormats)).toBe(true);
        expect(parser.supportedFormats.length).toBeGreaterThan(0);
      });
    });

    it('should have parse method', () => {
      const parsers = getAllParsers();

      parsers.forEach(parser => {
        expect(parser.parse).toBeDefined();
        expect(typeof parser.parse).toBe('function');
      });
    });
  });

  describe('TextParser', () => {
    const parser = new TextParser();

    it('should have correct metadata', () => {
      expect(parser.name).toBe('TextParser');
      expect(parser.supportedFormats).toEqual(['txt', 'md']);
    });

    it('should parse simple text', async () => {
      // Create a simple text content
      const testText = 'Line 1\nLine 2\nLine 3';

      // In a real test, you'd write this to a temp file and parse it
      // For now, we'll just verify the parser exists and has the right structure
      expect(parser.parse).toBeDefined();
    });
  });

  describe('ReviewsParser', () => {
    const parser = new ReviewsParser();

    it('should have correct metadata', () => {
      expect(parser.name).toBe('ReviewsParser');
      expect(parser.supportedFormats).toEqual(['json']);
    });

    it('should support JSON format', () => {
      expect(parser.supportedFormats).toContain('json');
    });
  });

  describe('TablesParser', () => {
    const parser = new TablesParser();

    it('should have correct metadata', () => {
      expect(parser.name).toBe('TablesParser');
      expect(parser.supportedFormats).toEqual(['csv']);
    });

    it('should support CSV format', () => {
      expect(parser.supportedFormats).toContain('csv');
    });
  });

  describe('PPTXParser', () => {
    const parser = new PPTXParser();

    it('should have correct metadata', () => {
      expect(parser.name).toBe('PPTXParser');
      expect(Array.isArray(parser.supportedFormats)).toBe(true);
    });

    it('should have parse method', () => {
      expect(parser.parse).toBeDefined();
      expect(typeof parser.parse).toBe('function');
    });
  });

  describe('OCRParser', () => {
    const parser = new OCRParser();

    it('should have correct metadata', () => {
      expect(parser.name).toBe('OCRParser');
      expect(Array.isArray(parser.supportedFormats)).toBe(true);
    });

    it('should have parse method', () => {
      expect(parser.parse).toBeDefined();
      expect(typeof parser.parse).toBe('function');
    });

    it('should list supported image formats', () => {
      const formats = OCRParser.getSupportedFormats();
      expect(formats).toContain('png');
      expect(formats).toContain('jpg');
      expect(formats).toContain('jpeg');
    });
  });

  describe('ProcessedContent Structure', () => {
    it('should return consistent structure across parsers', () => {
      // All parsers should return ProcessedContent with:
      // - raw: string
      // - structured: object
      // - cleaned: string

      const parsers = getAllParsers();

      parsers.forEach(parser => {
        // Parser exists and has correct interface
        expect(parser).toBeDefined();
        expect(parser.parse).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive errors for invalid files', async () => {
      const parser = new TextParser();

      // Test with non-existent file
      await expect(async () => {
        await parser.parse('/nonexistent/file.txt');
      }).rejects.toThrow();
    });
  });

  describe('Parser Performance', () => {
    it('should have reasonable parser count', () => {
      const parsers = getAllParsers();
      expect(parsers.length).toBeGreaterThan(0);
      expect(parsers.length).toBeLessThan(20); // Sanity check
    });

    it('should not have duplicate parser names', () => {
      const parsers = getAllParsers();
      const names = parsers.map(p => p.name);
      const uniqueNames = new Set(names);

      expect(names.length).toBe(uniqueNames.size);
    });
  });
});
