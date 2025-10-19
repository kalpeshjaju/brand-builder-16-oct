/**
 * Tables Parser - Parse CSV and tabular data
 *
 * Supports:
 * - CSV files
 * - TSV files
 * - Simple table detection and extraction
 */

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import { FileSystemUtils } from '../../utils/file-system.js';

export interface TablesParserOptions extends ParserConfig {
  delimiter?: string; // Auto-detected if not provided
  hasHeader?: boolean; // Default: true
  skipEmptyRows?: boolean; // Default: true
}

export class TablesParser implements Parser {
  name = 'TablesParser';
  supportedFormats: FileFormat[] = ['csv'];

  /**
   * Parse CSV/TSV file
   */
  async parse(
    filePath: string,
    options?: TablesParserOptions
  ): Promise<ProcessedContent> {
    const content = await FileSystemUtils.readFile(filePath);

    // Detect delimiter
    const delimiter = options?.delimiter || this.detectDelimiter(content);
    const hasHeader = options?.hasHeader ?? true;
    const skipEmptyRows = options?.skipEmptyRows ?? true;

    // Parse rows
    const rows = this.parseRows(content, delimiter, skipEmptyRows);

    if (rows.length === 0) {
      return {
        raw: content,
        structured: {},
        cleaned: '',
      };
    }

    // Extract header and data
    const firstRow = rows[0];
    if (!firstRow) {
      return {
        raw: content,
        structured: {},
        cleaned: '',
      };
    }

    const header = hasHeader ? firstRow : this.generateHeader(firstRow.length);
    const data = hasHeader ? rows.slice(1) : rows;

    // Build structured format
    const structured: any = {
      tables: [{
        columns: header,
        rows: data,
        rowCount: data.length,
        columnCount: header.length,
      }],
      data: this.rowsToObjects(header, data),
    };

    // Build raw text
    const raw = content;

    // Build cleaned text (for indexing)
    const cleaned = this.buildCleanedText(header, data);

    return {
      raw,
      structured,
      cleaned,
    };
  }

  /**
   * Detect delimiter (comma, tab, pipe, semicolon)
   */
  private detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0] || '';

    const delimiters = [',', '\t', '|', ';'];
    let maxCount = 0;
    let detectedDelimiter = ',';

    for (const delimiter of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = delimiter;
      }
    }

    return detectedDelimiter;
  }

  /**
   * Parse rows from content
   */
  private parseRows(
    content: string,
    delimiter: string,
    skipEmptyRows: boolean
  ): string[][] {
    const lines = content.split(/\r?\n/);
    const rows: string[][] = [];

    for (const line of lines) {
      if (skipEmptyRows && line.trim().length === 0) {
        continue;
      }

      // Simple CSV parsing (doesn't handle quoted fields with delimiters)
      // For production, use a CSV library like papaparse
      const cells = line.split(delimiter).map((cell) => cell.trim());

      rows.push(cells);
    }

    return rows;
  }

  /**
   * Generate default header
   */
  private generateHeader(columnCount: number): string[] {
    const header: string[] = [];
    for (let i = 0; i < columnCount; i++) {
      header.push(`Column ${i + 1}`);
    }
    return header;
  }

  /**
   * Convert rows to array of objects
   */
  private rowsToObjects(header: string[], data: string[][]): Record<string, string>[] {
    return data.map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((col, i) => {
        obj[col] = row[i] || '';
      });
      return obj;
    });
  }

  /**
   * Build cleaned text for indexing
   */
  private buildCleanedText(header: string[], data: string[][]): string {
    const parts: string[] = [];

    // Add header as context
    parts.push(`Columns: ${header.join(', ')}`);

    // Add data rows (limit to first 100 rows for indexing)
    const limitedData = data.slice(0, 100);
    limitedData.forEach((row, rowIndex) => {
      const rowText = header
        .map((col, i) => `${col}: ${row[i] || ''}`)
        .filter((text) => {
          const value = text.split(': ')[1];
          return value && value.trim().length > 0;
        })
        .join(', ');

      if (rowText.length > 0) {
        parts.push(`Row ${rowIndex + 1}: ${rowText}`);
      }
    });

    return parts.join('\n');
  }
}
