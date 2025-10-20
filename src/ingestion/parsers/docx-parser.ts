// DOCX Parser - Extract content from Word documents

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import mammoth from 'mammoth';
import { load } from 'cheerio';

type CheerioRoot = ReturnType<typeof load>;

export class DOCXParser implements Parser {
  name = 'DOCXParser';
  supportedFormats: FileFormat[] = ['docx'];

  /**
   * Parse DOCX file and extract structured content
   */
  async parse(filePath: string, config?: ParserConfig): Promise<ProcessedContent> {
    try {
      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml(
        { path: filePath },
        {
          // Preserve heading styles
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
          ],
        }
      );

      const html = result.value;

      // Extract text content
      const rawText = await mammoth.extractRawText({ path: filePath });
      const raw = rawText.value;

      // Parse HTML structure with cheerio
      const $ = load(html);

      // Extract sections
      const sections = this.extractSections($);

      // Extract headings
      const headings = this.extractHeadings($);

      // Extract tables
      const tables = config?.extractTables ? this.extractTables($) : [];

      // Build processed content
      const processed: ProcessedContent = {
        raw,
        structured: {
          sections,
          headings,
          tables: tables.length > 0 ? tables : undefined,
        },
        cleaned: this.cleanText(raw, config),
      };

      return processed;
    } catch (error) {
      throw new Error(
        `Failed to parse DOCX at ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the file is a valid DOCX and you have read permissions.`
      );
    }
  }

  /**
   * Extract sections based on headings
   */
  private extractSections($: CheerioRoot): string[] {
    const sections: string[] = [];

    // Find all heading elements
    const headings = $('h1, h2, h3, h4, h5, h6');

    if (headings.length === 0) {
      // No headings - treat entire document as one section
      const text = $('body').text().trim();
      if (text) {
        sections.push(text);
      }
      return sections;
    }

    // Extract content between headings
    headings.each((_index, heading) => {
      const $heading = $(heading);
      const sectionContent: string[] = [$heading.text()];

      // Get all siblings until next heading
      let $current = $heading.next();
      while ($current.length > 0 && !$current.is('h1, h2, h3, h4, h5, h6')) {
        const text = $current.text().trim();
        if (text) {
          sectionContent.push(text);
        }
        $current = $current.next();
      }

      sections.push(sectionContent.join('\n'));
    });

    return sections;
  }

  /**
   * Extract all headings with their levels
   */
  private extractHeadings($: CheerioRoot): string[] {
    const headings: string[] = [];

    $('h1, h2, h3, h4, h5, h6').each((_index, element) => {
      const text = $(element).text().trim();
      if (text) {
        headings.push(text);
      }
    });

    return headings;
  }

  /**
   * Extract tables from HTML
   */
  private extractTables($: CheerioRoot): Array<{ headers: string[]; rows: string[][]; raw: string }> {
    const tables: Array<{ headers: string[]; rows: string[][]; raw: string }> = [];

    $('table').each((_index, table) => {
      const $table = $(table);

      // Extract headers
      const headers: string[] = [];
      $table.find('thead th, tr:first-child th, tr:first-child td').each((_cellIndex, cell) => {
        headers.push($(cell).text().trim());
      });

      // Extract rows
      const rows: string[][] = [];
      $table.find('tbody tr, tr').each((i, row) => {
        // Skip header row if it's the first row and we already extracted headers
        if (i === 0 && headers.length > 0 && !$(row).parent().is('tbody')) {
          return;
        }

        const rowData: string[] = [];
        $(row).find('td, th').each((_columnIndex, cell) => {
          rowData.push($(cell).text().trim());
        });

        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      if (headers.length > 0 || rows.length > 0) {
        tables.push({
          headers,
          rows,
          raw: $table.text().trim(),
        });
      }
    });

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

      // Remove common artifacts
      cleaned = cleaned.replace(/\r/g, ''); // Carriage return
    }

    return cleaned.trim();
  }
}
