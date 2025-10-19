import { z } from 'zod';
import { CONTENT_REQUIREMENTS } from '../config/constants.js';

export const brandNameSchema = z
  .string({ required_error: 'Brand name is required' })
  .trim()
  .min(Math.max(2, CONTENT_REQUIREMENTS.MIN_LENGTH), 'Brand name must be at least 2 characters long')
  .max(100, 'Brand name must be less than 100 characters')
  .regex(/^[\w\s&\-\.,]+$/u, 'Brand name contains invalid characters');

export const cliQuerySchema = z
  .string({ required_error: 'Query is required' })
  .trim()
  .min(CONTENT_REQUIREMENTS.MIN_LENGTH, 'Query cannot be empty')
  .max(4_000, 'Query is too long');

export const filePathSchema = z
  .string({ required_error: 'File path is required' })
  .trim()
  .max(1_000, 'File path is too long')
  .refine(value => !value.includes('\0'), 'Invalid file path');

const askFormatSchema = z.enum(['text', 'json']);
const reportFormatSchema = z.enum(['json', 'markdown', 'html', 'both']);
const strategyModeSchema = z.enum(['fast', 'professional', 'research']);
const auditModeSchema = z.enum(['quick', 'standard', 'comprehensive']);
const contextActionSchema = z.enum(['status', 'list', 'clear', 'sync']);
const contextFormatSchema = z.enum(['table', 'json']);

export const positiveIntegerSchema = z.coerce.number().int().min(1);

const optionalTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[\w\s&\-\.,]+$/u, 'Value contains invalid characters')
  .optional();

export function sanitizeBrandName(value: unknown): string {
  return brandNameSchema.parse(value);
}

export function sanitizeQuery(value: unknown): string {
  return cliQuerySchema.parse(value);
}

export function sanitizeAskFormat(value: unknown): 'text' | 'json' {
  return askFormatSchema.parse(value);
}

export function sanitizeReportFormat(value: unknown): 'json' | 'markdown' | 'html' | 'both' {
  return reportFormatSchema.parse(value);
}

export function sanitizeStrategyMode(value: unknown): 'fast' | 'professional' | 'research' {
  return strategyModeSchema.parse(value);
}

export function sanitizeAuditMode(value: unknown): 'quick' | 'standard' | 'comprehensive' {
  return auditModeSchema.parse(value);
}

export function sanitizeContextAction(value: unknown): 'status' | 'list' | 'clear' | 'sync' {
  return contextActionSchema.parse(value);
}

export function sanitizeContextFormat(value: unknown): 'table' | 'json' {
  return contextFormatSchema.parse(value);
}

export function sanitizePositiveInteger(value: unknown): number {
  return positiveIntegerSchema.parse(value);
}

export function sanitizeOptionalText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return optionalTextSchema.parse(value);
}

export function sanitizeFilePath(value: unknown): string {
  return filePathSchema.parse(value);
}
