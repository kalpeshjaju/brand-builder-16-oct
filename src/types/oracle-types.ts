export interface OracleContextItem {
  query: string;
  snippets: string[];
}

export interface OracleContextOutput {
  brandName: string;
  generatedAt: string;
  items: OracleContextItem[];
}

