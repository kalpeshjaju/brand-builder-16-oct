// Fact Triple Extractor - Extract structured facts from text

import type { FactTriple } from '../types/index.js';

export class FactExtractor {
  /**
   * Extract fact triples from text using regex patterns
   */
  extractFacts(text: string): FactTriple[] {
    const facts: FactTriple[] = [];

    // Pattern 1: Numeric facts (e.g., "Revenue of $10M", "Founded in 2020")
    const numericPattern = /(?:is|was|has|have|reached|achieved|generated)\s+(?:a|an|the)?\s*(\$?[\d,]+[KMB]?|\d{4})\s*(?:in|from|during|since)?\s*([\w\s]+)/gi;
    let match;

    while ((match = numericPattern.exec(text)) !== null) {
      facts.push({
        subject: 'Company',
        predicate: 'has metric',
        value: match[1] || '',
        confidence: 0.7,
        sourceText: match[0] || '',
        type: 'numeric',
      });
    }

    // Pattern 2: Categorical facts (e.g., "is a premium brand", "operates in retail")
    const categoricalPattern = /([\w\s]+)\s+(?:is|are|was|were)\s+(?:a|an|the)?\s*([\w\s]+)/gi;

    while ((match = categoricalPattern.exec(text)) !== null) {
      if (match[1] && match[2] && match[1].length < 50 && match[2].length < 50) {
        facts.push({
          subject: match[1].trim(),
          predicate: 'is',
          value: match[2].trim(),
          confidence: 0.6,
          sourceText: match[0] || '',
          type: 'categorical',
        });
      }
    }

    return facts;
  }

  /**
   * Filter high-confidence facts
   */
  getHighConfidenceFacts(facts: FactTriple[], threshold: number = 0.7): FactTriple[] {
    return facts.filter((fact) => fact.confidence >= threshold);
  }

  /**
   * Group facts by type
   */
  groupByType(facts: FactTriple[]): Record<string, FactTriple[]> {
    return facts.reduce((acc, fact) => {
      if (!acc[fact.type]) {
        acc[fact.type] = [];
      }
      acc[fact.type]?.push(fact);
      return acc;
    }, {} as Record<string, FactTriple[]>);
  }
}
