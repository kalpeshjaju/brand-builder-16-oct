/**
 * Web Fetcher Utility
 *
 * Fetches and extracts content from web pages
 * Includes retry logic, caching, and error handling
 */

import axios, { AxiosError } from 'axios';
import { load, type CheerioAPI } from 'cheerio';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import pRetry from 'p-retry';
import { Logger } from './logger.js';

const logger = new Logger('WebFetcher');

export interface WebFetchResult {
  url: string;
  title: string;
  content: string;
  metaDescription?: string;
  headings: string[];
  links: string[];
  fetchedAt: string;
  cached: boolean;
}

export interface WebFetchOptions {
  timeout?: number;
  maxContentLength?: number;
  useCache?: boolean;
  cacheDir?: string;
  retries?: number;
  userAgent?: string;
}

const DEFAULT_OPTIONS: Required<WebFetchOptions> = {
  timeout: 10000,
  maxContentLength: 500000, // 500KB
  useCache: true,
  cacheDir: './.cache/web-fetcher',
  retries: 3,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

export class WebFetcher {
  private options: Required<WebFetchOptions>;

  constructor(options?: WebFetchOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Fetch and extract content from a URL
   */
  async fetch(url: string): Promise<WebFetchResult> {
    logger.info('Fetching URL', { url });

    // Check cache first
    if (this.options.useCache) {
      const cached = await this.getFromCache(url);
      if (cached) {
        logger.info('Using cached content', { url });
        return { ...cached, cached: true };
      }
    }

    try {
      // Fetch with retry logic
      const html = await pRetry(
        () => this.fetchHtml(url),
        {
          retries: this.options.retries,
          onFailedAttempt: (error) => {
            logger.warn(`Fetch attempt ${error.attemptNumber} failed`, {
              url,
              retriesLeft: error.retriesLeft,
              error: String(error),
            });
          },
        }
      );

      // Extract content
      const result = this.extractContent(url, html);

      // Cache result
      if (this.options.useCache) {
        await this.saveToCache(url, result);
      }

      logger.info('Successfully fetched and extracted content', {
        url,
        contentLength: result.content.length,
      });

      return { ...result, cached: false };
    } catch (error) {
      logger.error('Failed to fetch URL after retries', { url, error });
      throw new Error(
        `Failed to fetch ${url}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Check URL accessibility and network connection.`
      );
    }
  }

  /**
   * Fetch HTML from URL
   */
  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: this.options.timeout,
        maxContentLength: this.options.maxContentLength,
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        validateStatus: (status) => status === 200,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          throw new Error(`HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`);
        } else if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout');
        } else if (axiosError.code === 'ENOTFOUND') {
          throw new Error('Domain not found');
        }
      }
      throw error;
    }
  }

  /**
   * Extract content from HTML
   */
  private extractContent(url: string, html: string): WebFetchResult {
    const $ = load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, iframe, noscript').remove();

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') ||
                           $('meta[property="og:description"]').attr('content');

    // Extract headings
    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 200) {
        headings.push(text);
      }
    });

    // Extract main content
    let content = '';

    // Try to find main content area
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '#content',
      '.content',
      '#main',
      '.main',
      'body',
    ];

    for (const selector of mainSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize newlines
      .trim();

    // Limit content length (keep first ~8000 chars)
    if (content.length > 8000) {
      content = content.slice(0, 8000) + '...';
    }

    // Extract internal links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
        try {
          const absoluteUrl = new URL(href, url).href;
          if (absoluteUrl.startsWith('http') && !links.includes(absoluteUrl)) {
            links.push(absoluteUrl);
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    });

    return {
      url,
      title,
      content,
      metaDescription,
      headings: headings.slice(0, 20), // Limit to 20 headings
      links: links.slice(0, 50), // Limit to 50 links
      fetchedAt: new Date().toISOString(),
      cached: false,
    };
  }

  /**
   * Get cache file path for URL
   */
  private getCachePath(url: string): string {
    const hash = createHash('sha256').update(url).digest('hex');
    return path.join(this.options.cacheDir, `${hash}.json`);
  }

  /**
   * Get cached result
   */
  private async getFromCache(url: string): Promise<WebFetchResult | null> {
    const cachePath = this.getCachePath(url);

    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      const cached = JSON.parse(content) as WebFetchResult;

      // Check if cache is fresh (less than 7 days old)
      const cacheAge = Date.now() - new Date(cached.fetchedAt).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (cacheAge < maxAge) {
        return cached;
      } else {
        logger.debug('Cache expired', { url, ageHours: cacheAge / (60 * 60 * 1000) });
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Save result to cache
   */
  private async saveToCache(url: string, result: WebFetchResult): Promise<void> {
    const cachePath = this.getCachePath(url);

    try {
      // Ensure cache directory exists
      await fs.mkdir(this.options.cacheDir, { recursive: true });

      // Save to cache
      await fs.writeFile(cachePath, JSON.stringify(result, null, 2), 'utf-8');
      logger.debug('Saved to cache', { url });
    } catch (error) {
      logger.warn('Failed to save to cache', { url, error });
      // Don't throw - caching is optional
    }
  }

  /**
   * Clear cache for a URL
   */
  async clearCache(url: string): Promise<void> {
    const cachePath = this.getCachePath(url);
    try {
      await fs.unlink(cachePath);
      logger.info('Cache cleared', { url });
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      await fs.rm(this.options.cacheDir, { recursive: true, force: true });
      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', error);
    }
  }
}

/**
 * Singleton instance for convenient usage
 */
export const webFetcher = new WebFetcher();
