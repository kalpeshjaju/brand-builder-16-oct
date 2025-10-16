// Daemon Service types - Background processing

import type { FileWatchEvent } from './context-types.js';
import type { IngestionResult } from './ingestion-types.js';

export type DaemonStatus = 'idle' | 'processing' | 'error' | 'stopped';
export type TaskType = 'ingest' | 'index' | 'audit' | 'generate' | 'query';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface DaemonConfig {
  watchInterval: number; // milliseconds
  autoProcess: boolean;
  maxConcurrentTasks: number;
  retryAttempts: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface DaemonTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  payload: unknown;
  priority: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  attempts: number;
}

export interface DaemonState {
  status: DaemonStatus;
  currentTask?: DaemonTask;
  queueLength: number;
  processedCount: number;
  errorCount: number;
  uptime: number; // milliseconds
  lastActivity: string;
}

export interface DaemonEvent {
  type: 'task_started' | 'task_completed' | 'task_failed' | 'file_detected' | 'error';
  timestamp: string;
  data: unknown;
}

export interface FileProcessingTask {
  type: 'ingest';
  payload: {
    filePath: string;
    category: string;
    options?: unknown;
  };
}

export interface StrategyGenerationTask {
  type: 'generate';
  payload: {
    brandName: string;
    mode: string;
  };
}

export interface AuditTask {
  type: 'audit';
  payload: {
    strategyPath: string;
    outputPath?: string;
  };
}

export interface QueryTask {
  type: 'query';
  payload: {
    query: string;
    options?: unknown;
  };
}

export type AnyDaemonTask =
  | FileProcessingTask
  | StrategyGenerationTask
  | AuditTask
  | QueryTask;

export interface DaemonEventHandler {
  onFileDetected?(event: FileWatchEvent): void;
  onTaskStarted?(task: DaemonTask): void;
  onTaskCompleted?(task: DaemonTask, result: unknown): void;
  onTaskFailed?(task: DaemonTask, error: Error): void;
  onError?(error: Error): void;
}
