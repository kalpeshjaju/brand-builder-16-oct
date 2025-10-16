// Formatting and text utilities

export class FormattingUtils {
  /**
   * Format date to ISO string
   */
  static formatDate(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * Format date to human-readable string
   */
  static formatDateHuman(date: Date = new Date()): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  /**
   * Sanitize string for use as filename
   */
  static sanitizeFilename(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Capitalize first letter
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert string to title case
   */
  static toTitleCase(str: string): string {
    return str
      .split(' ')
      .map(word => this.capitalize(word.toLowerCase()))
      .join(' ');
  }

  /**
   * Pluralize word based on count
   */
  static pluralize(word: string, count: number): string {
    if (count === 1) return word;
    if (word.endsWith('y')) return word.slice(0, -1) + 'ies';
    if (word.endsWith('s')) return word + 'es';
    return word + 's';
  }

  /**
   * Format number with commas
   */
  static formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * Generate slug from string
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
