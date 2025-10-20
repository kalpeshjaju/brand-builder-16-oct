/**
 * JSON Parser Utility
 *
 * Robust JSON parsing from LLM responses with multiple fallback strategies
 */

import { Logger } from './logger.js';

const logger = new Logger('JSONParser');
const MAX_JSON_LENGTH = 100_000;
const LOG_PREVIEW_LENGTH = 200;

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  method?: string;
}

/**
 * Parse JSON from LLM response with multiple fallback strategies
 */
export function parseJSON<T>(response: string, defaultValue?: T): ParseResult<T> {
  if (response.length > MAX_JSON_LENGTH) {
    const preview = response.slice(0, LOG_PREVIEW_LENGTH);
    logger.error('JSON response exceeds maximum parse length', {
      length: response.length,
      maxLength: MAX_JSON_LENGTH,
      preview,
    });
    return {
      success: false,
      error: `JSON response exceeds maximum length of ${MAX_JSON_LENGTH} characters`,
      data: defaultValue,
      method: 'length-check',
    };
  }

  // Strategy 1: Try to extract from markdown code block
  const codeBlockMatch = response.match(/```json\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const data = JSON.parse(codeBlockMatch[1]) as T;
      return { success: true, data, method: 'code-block' };
    } catch (error) {
      logger.debug('Failed to parse JSON from code block', error);
    }
  }

  // Strategy 2: Try to find JSON object in response
  const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      const data = JSON.parse(jsonObjectMatch[0]) as T;
      return { success: true, data, method: 'object-match' };
    } catch (error) {
      logger.debug('Failed to parse JSON from object match', error);
    }
  }

  // Strategy 3: Try to find JSON array in response
  const jsonArrayMatch = response.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    try {
      const data = JSON.parse(jsonArrayMatch[0]) as T;
      return { success: true, data, method: 'array-match' };
    } catch (error) {
      logger.debug('Failed to parse JSON from array match', error);
    }
  }

  // Strategy 4: Clean up response and try parsing
  const cleaned = cleanJSONString(response);
  if (cleaned) {
    try {
      const data = JSON.parse(cleaned) as T;
      return { success: true, data, method: 'cleaned' };
    } catch (error) {
      logger.debug('Failed to parse cleaned JSON', error);
    }
  }

  // Strategy 5: Try to fix common JSON issues
  const fixed = fixCommonJSONIssues(response);
  if (fixed) {
    try {
      const data = JSON.parse(fixed) as T;
      return { success: true, data, method: 'fixed' };
    } catch (error) {
      logger.debug('Failed to parse fixed JSON', error);
    }
  }

  // All strategies failed
  const errorMsg = `Failed to parse JSON from response after 5 strategies`;
  logger.error(errorMsg, { responsePreview: response.slice(0, LOG_PREVIEW_LENGTH) });

  if (defaultValue !== undefined) {
    logger.warn('Using default value', { defaultValue });
    return { success: false, data: defaultValue, error: errorMsg, method: 'default' };
  }

  return { success: false, error: errorMsg };
}

/**
 * Clean JSON string by removing common LLM response artifacts
 */
function cleanJSONString(str: string): string | null {
  try {
    // Remove leading/trailing non-JSON content
    let cleaned = str.trim();

    // Remove markdown code fence if present
    cleaned = cleaned.replace(/^```json\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');

    // Remove "Here is the JSON:" type prefixes
    cleaned = cleaned.replace(/^.*?(?=\{|\[)/s, '');

    // Remove trailing explanations after JSON
    const jsonEnd = Math.max(
      cleaned.lastIndexOf('}'),
      cleaned.lastIndexOf(']')
    );
    if (jsonEnd !== -1) {
      cleaned = cleaned.slice(0, jsonEnd + 1);
    }

    return cleaned.trim();
  } catch {
    return null;
  }
}

/**
 * Fix common JSON formatting issues
 */
function fixCommonJSONIssues(str: string): string | null {
  try {
    let fixed = str;

    // Fix single quotes to double quotes
    fixed = fixed.replace(/'/g, '"');

    // Fix trailing commas
    fixed = fixed.replace(/,\s*([\]}])/g, '$1');

    // Fix missing commas between array items
    fixed = fixed.replace(/"\s+"/g, '","');

    // Fix unquoted keys
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // Remove comments (// and /* */)
    fixed = fixed.replace(/\/\/.*$/gm, '');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

    return cleanJSONString(fixed);
  } catch {
    return null;
  }
}

/**
 * Parse JSON with a specific schema/type expectation
 */
export function parseJSONWithSchema<T>(
  response: string,
  validate: (data: any) => data is T,
  defaultValue?: T
): ParseResult<T> {
  const result = parseJSON<T>(response, defaultValue);

  if (result.success && result.data) {
    if (validate(result.data)) {
      return result;
    } else {
      logger.warn('Parsed JSON does not match expected schema');
      return {
        success: false,
        error: 'Invalid schema',
        data: defaultValue,
        method: 'validation-failed',
      };
    }
  }

  return result;
}

/**
 * Extract and parse JSON array from response
 */
export function parseJSONArray<T>(response: string, defaultValue: T[] = []): ParseResult<T[]> {
  const result = parseJSON<T[]>(response, defaultValue);

  if (result.success && result.data && Array.isArray(result.data)) {
    return result;
  }

  // Try to extract array from object
  if (result.success && result.data && typeof result.data === 'object') {
    // Check if any property is an array
    for (const value of Object.values(result.data)) {
      if (Array.isArray(value)) {
        return { success: true, data: value as T[], method: 'extracted-from-object' };
      }
    }
  }

  logger.warn('Expected array but got different type', { type: typeof result.data });
  return { success: false, data: defaultValue, error: 'Not an array' };
}

/**
 * Safe JSON parse helper (simple wrapper)
 */
export function safeJSONParse<T>(str: string, defaultValue: T): T {
  const result = parseJSON<T>(str, defaultValue);
  return result.data ?? defaultValue;
}
