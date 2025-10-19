/**
 * Reviews Parser - Parse user reviews from JSON/API sources
 *
 * Supports:
 * - JSON files (exported reviews)
 * - Review aggregation platforms (Trustpilot, G2, Capterra format)
 * - Sentiment analysis placeholders
 */

import type { Parser, ProcessedContent, ParserConfig } from '../../types/ingestion-types.js';
import type { FileFormat } from '../../types/context-types.js';
import { FileSystemUtils } from '../../utils/file-system.js';

export interface ReviewsParserOptions extends ParserConfig {
  extractSentiment?: boolean;
  aggregateRatings?: boolean;
}

export interface Review {
  id?: string;
  author?: string;
  rating?: number;
  title?: string;
  content: string;
  date?: string;
  source?: string;
  verified?: boolean;
}

export class ReviewsParser implements Parser {
  name = 'ReviewsParser';
  supportedFormats: FileFormat[] = ['json'];

  /**
   * Parse reviews from JSON file
   */
  async parse(
    filePath: string,
    options?: ReviewsParserOptions
  ): Promise<ProcessedContent> {
    // Read JSON file
    const content = await FileSystemUtils.readFile(filePath);
    const data = JSON.parse(content);

    // Detect format and extract reviews
    const reviews = this.extractReviews(data);

    // Build structured output
    const structured: any = {
      reviewCount: reviews.length,
      reviews: reviews.slice(0, 100), // Limit to first 100 for structure
    };

    if (options?.aggregateRatings) {
      structured.aggregateRatings = this.aggregateRatings(reviews);
    }

    if (options?.extractSentiment) {
      structured.sentiment = this.analyzeSentiment(reviews);
    }

    // Build raw text (all reviews concatenated)
    const raw = reviews.map((r) => `${r.title || ''}\n${r.content}`).join('\n\n');

    // Build cleaned text (for indexing)
    const cleaned = reviews
      .map((r) => {
        const text = `${r.title || ''} ${r.content}`;
        return text.replace(/[^\w\s.,!?-]/g, '').trim();
      })
      .join('\n');

    return {
      raw,
      structured,
      cleaned,
    };
  }

  /**
   * Extract reviews from various JSON formats
   */
  private extractReviews(data: any): Review[] {
    const reviews: Review[] = [];

    // Format 1: Array of reviews
    if (Array.isArray(data)) {
      data.forEach((item) => {
        reviews.push(this.normalizeReview(item));
      });
    }
    // Format 2: Object with reviews array
    else if (data.reviews && Array.isArray(data.reviews)) {
      data.reviews.forEach((item: any) => {
        reviews.push(this.normalizeReview(item));
      });
    }
    // Format 3: Nested data
    else if (data.data && Array.isArray(data.data)) {
      data.data.forEach((item: any) => {
        reviews.push(this.normalizeReview(item));
      });
    }
    // Format 4: Single review object
    else if (data.content || data.text || data.review) {
      reviews.push(this.normalizeReview(data));
    }

    return reviews;
  }

  /**
   * Normalize review object to standard format
   */
  private normalizeReview(item: any): Review {
    return {
      id: item.id || item.reviewId || undefined,
      author: item.author || item.user || item.reviewer || undefined,
      rating: this.extractRating(item),
      title: item.title || item.heading || undefined,
      content: item.content || item.text || item.review || item.body || '',
      date: item.date || item.createdAt || item.timestamp || undefined,
      source: item.source || item.platform || undefined,
      verified: item.verified || item.isVerified || false,
    };
  }

  /**
   * Extract rating from various formats
   */
  private extractRating(item: any): number | undefined {
    if (typeof item.rating === 'number') return item.rating;
    if (typeof item.stars === 'number') return item.stars;
    if (typeof item.score === 'number') return item.score;

    // Try to parse string ratings
    if (typeof item.rating === 'string') {
      const parsed = parseFloat(item.rating);
      if (!isNaN(parsed)) return parsed;
    }

    return undefined;
  }

  /**
   * Aggregate ratings across reviews
   */
  private aggregateRatings(reviews: Review[]): any {
    const ratingsWithValues = reviews.filter((r) => r.rating !== undefined);

    if (ratingsWithValues.length === 0) {
      return { available: false };
    }

    const sum = ratingsWithValues.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = sum / ratingsWithValues.length;

    // Rating distribution
    const distribution: Record<number, number> = {};
    ratingsWithValues.forEach((r) => {
      const rating = Math.round(r.rating || 0);
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    return {
      available: true,
      average: Math.round(average * 10) / 10,
      count: ratingsWithValues.length,
      distribution,
    };
  }

  /**
   * Simple sentiment analysis (placeholder - use NLP library in production)
   */
  private analyzeSentiment(reviews: Review[]): any {
    const positiveWords = new Set([
      'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic',
      'perfect', 'wonderful', 'outstanding', 'superb', 'brilliant',
    ]);

    const negativeWords = new Set([
      'bad', 'terrible', 'worst', 'hate', 'awful', 'horrible', 'poor',
      'disappointing', 'useless', 'broken', 'fail', 'waste',
    ]);

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    reviews.forEach((review) => {
      const text = (review.content + ' ' + (review.title || '')).toLowerCase();
      const words = text.split(/\s+/);

      const hasPositive = words.some((w) => positiveWords.has(w));
      const hasNegative = words.some((w) => negativeWords.has(w));

      if (hasPositive && !hasNegative) {
        positiveCount++;
      } else if (hasNegative && !hasPositive) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });

    const total = reviews.length;

    return {
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount,
      positiveRatio: total > 0 ? positiveCount / total : 0,
      negativeRatio: total > 0 ? negativeCount / total : 0,
    };
  }
}
