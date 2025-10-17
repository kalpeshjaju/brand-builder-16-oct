/**
 * Tests for JSON parser utility
 */

import { describe, it, expect } from 'vitest';
import {
  parseJSON,
  parseJSONArray,
  safeJSONParse,
  parseJSONWithSchema,
} from '../../../src/utils/json-parser.js';

describe('JSON Parser', () => {
  describe('parseJSON', () => {
    it('should parse valid JSON object', () => {
      const json = '{"name": "Test", "value": 123}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'Test', value: 123 });
      }
    });

    it('should handle invalid JSON', () => {
      const json = '{invalid json}';
      const result = parseJSON(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('JSON');
      }
    });

    it('should handle empty string', () => {
      const result = parseJSON('');

      expect(result.success).toBe(false);
    });

    it('should parse nested objects', () => {
      const json = '{"outer": {"inner": "value"}}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outer.inner).toBe('value');
      }
    });

    it('should handle arrays', () => {
      const json = '{"items": [1, 2, 3]}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toEqual([1, 2, 3]);
      }
    });

    it('should handle null values', () => {
      const json = '{"value": null}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBeNull();
      }
    });

    it('should handle boolean values', () => {
      const json = '{"enabled": true, "disabled": false}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
        expect(result.data.disabled).toBe(false);
      }
    });
  });

  describe('parseJSONArray', () => {
    it('should parse valid JSON array', () => {
      const json = '[{"id": 1}, {"id": 2}]';
      const result = parseJSONArray(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe(1);
      }
    });

    it('should reject non-array JSON', () => {
      const json = '{"not": "an array"}';
      const result = parseJSONArray(json);

      expect(result.success).toBe(false);
    });

    it('should handle empty array', () => {
      const json = '[]';
      const result = parseJSONArray(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should handle primitive values in array', () => {
      const json = '[1, "two", true, null]';
      const result = parseJSONArray(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 'two', true, null]);
      }
    });
  });

  describe('safeJSONParse', () => {
    it('should return parsed data for valid JSON', () => {
      const json = '{"key": "value"}';
      const result = safeJSONParse(json, { key: 'default' });

      expect(result).toEqual({ key: 'value' });
    });

    it('should return default value for invalid JSON', () => {
      const json = '{invalid}';
      const defaultValue = { key: 'default' };
      const result = safeJSONParse(json, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it('should handle empty string with default', () => {
      const result = safeJSONParse('', { empty: true });

      expect(result).toEqual({ empty: true });
    });
  });

  describe('parseJSONWithSchema', () => {
    // Define a type and validator function
    interface Person {
      name: string;
      age: number;
    }

    const validatePerson = (data: any): data is Person => {
      return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.name === 'string' &&
        typeof data.age === 'number'
      );
    };

    it('should validate correct schema', () => {
      const json = '{"name": "John", "age": 30}';
      const result = parseJSONWithSchema(json, validatePerson);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(30);
      }
    });

    it('should reject invalid schema', () => {
      const json = '{"name": 123, "age": "thirty"}'; // Wrong types
      const result = parseJSONWithSchema(json, validatePerson);

      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const json = '{"name": "John"}'; // Missing age
      const result = parseJSONWithSchema(json, validatePerson);

      expect(result.success).toBe(false);
    });

    it('should handle extra fields gracefully', () => {
      const json = '{"name": "John", "age": 30, "extra": "field"}';
      const result = parseJSONWithSchema(json, validatePerson);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(30);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', () => {
      const json = '{"big": 9007199254740991}'; // Number.MAX_SAFE_INTEGER
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.big).toBe(9007199254740991);
      }
    });

    it('should handle unicode characters', () => {
      const json = '{"text": "Hello 世界 🌍"}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('Hello 世界 🌍');
      }
    });

    it('should handle escaped characters', () => {
      const json = '{"quote": "He said \\"Hello\\""}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quote).toBe('He said "Hello"');
      }
    });

    it('should handle newlines in strings', () => {
      const json = '{"text": "Line 1\\nLine 2"}';
      const result = parseJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toContain('\n');
      }
    });
  });
});
