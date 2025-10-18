// CLI command and interaction types

import type { BrandConfiguration } from './brand-types.js';

export type CommandName =
  | 'init'
  | 'ask'
  | 'generate'
  | 'audit'
  | 'context'
  | 'ingest'
  | 'daemon'
  | 'help';

export interface BaseCommandOptions {
  brand?: string;
  workspace?: string;
  verbose?: boolean;
  quiet?: boolean;
}

export interface InitCommandOptions extends BaseCommandOptions {
  brand: string;
  industry?: string;
  category?: string;
  template?: 'minimal' | 'standard' | 'comprehensive';
  interactive?: boolean;
}

export interface AskCommandOptions extends BaseCommandOptions {
  query: string;
  strategy?: 'fast' | 'balanced' | 'precision';
  sources?: number;
  format?: 'text' | 'json';
}

export interface GenerateCommandOptions extends BaseCommandOptions {
  mode?: 'fast' | 'professional' | 'research';
  output?: string;
  format?: 'json' | 'markdown' | 'html' | 'both';
  useContext?: boolean; // Enable RAG mode (retrieve context from ORACLE)
}

export interface AuditCommandOptions extends BaseCommandOptions {
  input: string;
  output?: string;
  mode?: 'quick' | 'standard' | 'comprehensive';
  format?: 'json' | 'markdown' | 'both';
}

export interface ContextCommandOptions extends BaseCommandOptions {
  action: 'status' | 'list' | 'clear' | 'sync';
  category?: string;
  format?: 'table' | 'json';
}

export interface IngestCommandOptions extends BaseCommandOptions {
  file: string;
  category?: 'input' | 'resource' | 'document';
  extract?: boolean;
  index?: boolean;
}

export interface DaemonCommandOptions extends BaseCommandOptions {
  action: 'start' | 'stop' | 'status' | 'restart';
  detach?: boolean;
}

export interface CLIContext {
  workingDirectory: string;
  configPath: string;
  brandConfig?: BrandConfiguration;
  environmentVariables: Record<string, string>;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export interface CLIOutput {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: unknown;
}
