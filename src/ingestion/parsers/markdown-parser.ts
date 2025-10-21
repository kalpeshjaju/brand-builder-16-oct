// src/ingestion/parsers/markdown-parser.ts

import { FileSystemUtils } from '../../utils/file-system.js';

export class MarkdownParser {
  public async parse(filePath: string): Promise<string> {
    const content = await FileSystemUtils.readFile(filePath);
    // For now, we'll just return the raw text.
    // In the future, we could add more sophisticated parsing,
    // like stripping out frontmatter or handling sections.
    return content;
  }
}
