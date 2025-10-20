import { describe, expect, it } from 'vitest';
import {
  sanitizeAskFormat,
  sanitizeAuditMode,
  sanitizeBrandName,
  sanitizeContextAction,
  sanitizeContextFormat,
  sanitizeFilePath,
  sanitizeOptionalText,
  sanitizePositiveInteger,
  sanitizeQuery,
  sanitizeReportFormat,
  sanitizeStrategyMode,
} from '../../../src/validation/input-schemas.js';
import { ZodError } from 'zod';

describe('Validation Schemas', () => {
  it('sanitizes brand names with allowed characters', () => {
    expect(sanitizeBrandName('Acme & Co.')).toBe('Acme & Co.');
  });

  it('rejects brand names with invalid characters', () => {
    expect(() => sanitizeBrandName('Bad🚫Name')).toThrow(ZodError);
  });

  it('sanitizes CLI queries', () => {
    expect(sanitizeQuery('  What is the brand mission?  ')).toBe('What is the brand mission?');
  });

  it('rejects empty CLI queries', () => {
    expect(() => sanitizeQuery(' ')).toThrow(ZodError);
  });

  it('guards supported ask formats', () => {
    expect(sanitizeAskFormat('json')).toBe('json');
    expect(() => sanitizeAskFormat('yaml')).toThrow(ZodError);
  });

  it('ensures audit mode selection is valid', () => {
    expect(sanitizeAuditMode('standard')).toBe('standard');
    expect(() => sanitizeAuditMode('deep')).toThrow(ZodError);
  });

  it('validates context actions and formats', () => {
    expect(sanitizeContextAction('sync')).toBe('sync');
    expect(() => sanitizeContextAction('refresh')).toThrow(ZodError);
    expect(sanitizeContextFormat('json')).toBe('json');
    expect(() => sanitizeContextFormat('tableau')).toThrow(ZodError);
  });

  it('coerces positive integers from string input', () => {
    expect(sanitizePositiveInteger('5')).toBe(5);
    expect(() => sanitizePositiveInteger(0)).toThrow(ZodError);
  });

  it('normalizes optional text inputs', () => {
    expect(sanitizeOptionalText('  Feedback  ')).toBe('Feedback');
    expect(sanitizeOptionalText('')).toBeUndefined();
    expect(() => sanitizeOptionalText('invalid 🚫 value')).toThrow(ZodError);
  });

  it('validates strategy mode and report format options', () => {
    expect(sanitizeStrategyMode('professional')).toBe('professional');
    expect(() => sanitizeStrategyMode('expert')).toThrow(ZodError);
    expect(sanitizeReportFormat('both')).toBe('both');
    expect(() => sanitizeReportFormat('docx')).toThrow(ZodError);
  });

  it('rejects unsafe file paths', () => {
    expect(sanitizeFilePath('/tmp/brand.json')).toBe('/tmp/brand.json');
    expect(() => sanitizeFilePath('/tmp/bad\0path')).toThrow(ZodError);
  });
});
