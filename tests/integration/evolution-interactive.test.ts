import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreativeDirector } from '../../src/evolution/creative-director.js';
import type { PatternPresentationOutput } from '../../src/types/evolution-types.js';

// Mock inquirer with pre-defined responses
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('Creative Director - Interactive Mode', () => {
  let creativeDirector: CreativeDirector;
  let mockInquirer: any;

  // Sample pattern data for testing
  const mockPatterns: PatternPresentationOutput = {
    brandName: 'TestBrand',
    generatedAt: '2025-10-21T00:00:00.000Z',
    contradictions: [
      {
        id: 'contradiction-1',
        brandSays: 'Premium quality',
        evidenceShows: 'Budget pricing strategy',
        implication: 'Value perception mismatch',
        severity: 'high',
        sourcePages: ['homepage', 'pricing'],
      },
    ],
    whiteSpace: [
      {
        id: 'gap-1',
        description: 'No competitors address sustainability',
        opportunity: 'First-mover advantage in eco-friendly positioning',
        confidence: 0.8,
      },
    ],
    tensions: [],
    observations: [],
  };

  beforeEach(async () => {
    creativeDirector = new CreativeDirector();
    // Get the mocked inquirer
    const inquirer = await import('inquirer');
    mockInquirer = inquirer.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Interactive Mode', () => {
    it('should capture creative direction with full flow', async () => {
      // Setup: Mock all inquirer prompts in exact sequence
      mockInquirer.prompt
        // Contradiction 1
        .mockResolvedValueOnce({ action: 'explore' })
        .mockResolvedValueOnce({ direction: 'Reframe as "accessible premium"' })
        // White space 1
        .mockResolvedValueOnce({ decision: 'pursue' })
        .mockResolvedValueOnce({ reasoning: 'Strong market opportunity' })
        // Creative leap
        .mockResolvedValueOnce({ idea: 'Launch eco-luxury line' })
        .mockResolvedValueOnce({ rationale: 'Combines sustainability with premium' })
        .mockResolvedValueOnce({ more: false })
        // Intuition
        .mockResolvedValueOnce({ observation: 'Market ready for disruption' })
        .mockResolvedValueOnce({ context: 'Industry experience' })
        .mockResolvedValueOnce({ confidence: 0.9 })
        .mockResolvedValueOnce({ more: false })
        // Primary direction
        .mockResolvedValueOnce({ primaryDirection: 'Become the accessible sustainable premium brand' })
        // Key themes  
        .mockResolvedValueOnce({ keyThemes: ['sustainability', 'accessibility', 'quality'] });

      const result = await creativeDirector.captureDirection(mockPatterns, 'interactive');

      // Assertions
      expect(result).toBeDefined();
      expect(result.brandName).toBe('TestBrand');
      expect(result.selectedContradictions).toHaveLength(1);
      expect(result.whiteSpaceDecisions).toHaveLength(1);
      expect(result.creativeLeaps).toHaveLength(1);
      expect(result.intuitions).toHaveLength(1);
      expect(result.intuitions[0]).toEqual({
        observation: 'Market ready for disruption',
        context: 'Industry experience',
        confidence: 0.9,
      });
      expect(result.primaryDirection).toBe('Become the accessible sustainable premium brand');
      expect(result.keyThemes).toEqual(['sustainability', 'accessibility', 'quality']);

      // Verify inquirer was called correct number of times (13 total)
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(13);
    });

    it('should handle skipping contradictions and white space', async () => {
      // Setup: Skip contradiction and white space
      mockInquirer.prompt
        .mockResolvedValueOnce({ action: 'skip' })
        .mockResolvedValueOnce({ decision: 'skip' })
        // Creative leap
        .mockResolvedValueOnce({ idea: 'Quick test idea' })
        .mockResolvedValueOnce({ rationale: 'Testing skip flow' })
        .mockResolvedValueOnce({ more: false })
        // Intuition
        .mockResolvedValueOnce({ observation: 'Need more data' })
        .mockResolvedValueOnce({ context: 'Gut feeling' })
        .mockResolvedValueOnce({ confidence: 0.5 })
        .mockResolvedValueOnce({ more: false })
        // Primary direction
        .mockResolvedValueOnce({ primaryDirection: 'Maintain current course' })
        .mockResolvedValueOnce({ keyThemes: ['consistency'] });

      const result = await creativeDirector.captureDirection(mockPatterns, 'interactive');

      expect(result.selectedContradictions).toHaveLength(0);
      expect(result.whiteSpaceDecisions).toHaveLength(0);
      expect(result.creativeLeaps).toHaveLength(1);
      expect(result.primaryDirection).toBe('Maintain current course');
    });

    it('should support multiple creative leaps', async () => {
      // Setup: Multiple creative leaps
      mockInquirer.prompt
        .mockResolvedValueOnce({ action: 'skip' })
        .mockResolvedValueOnce({ decision: 'skip' })
        // First creative leap
        .mockResolvedValueOnce({ idea: 'Launch membership program' })
        .mockResolvedValueOnce({ rationale: 'Build recurring revenue' })
        .mockResolvedValueOnce({ more: true }) // Add another
        // Second creative leap
        .mockResolvedValueOnce({ idea: 'Partner with influencers' })
        .mockResolvedValueOnce({ rationale: 'Expand reach authentically' })
        .mockResolvedValueOnce({ more: false }) // Done
        // Intuition
        .mockResolvedValueOnce({ observation: 'Community is key' })
        .mockResolvedValueOnce({ context: 'Customer feedback' })
        .mockResolvedValueOnce({ confidence: 0.7 })
        .mockResolvedValueOnce({ more: false })
        // Primary direction
        .mockResolvedValueOnce({ primaryDirection: 'Build a movement' })
        .mockResolvedValueOnce({ keyThemes: ['community', 'authenticity'] });

      const result = await creativeDirector.captureDirection(mockPatterns, 'interactive');

      expect(result.creativeLeaps).toHaveLength(2);
      expect(result.creativeLeaps[0].idea).toBe('Launch membership program');
      expect(result.creativeLeaps[1].idea).toBe('Partner with influencers');
    });

    it('should handle empty creative leap to end', async () => {
      // Setup: Empty idea to skip creative leaps
      mockInquirer.prompt
        .mockResolvedValueOnce({ action: 'skip' })
        .mockResolvedValueOnce({ decision: 'skip' })
        // Empty idea ends creative leaps section
        .mockResolvedValueOnce({ idea: '' })
        // Empty observation ends intuitions section
        .mockResolvedValueOnce({ observation: '' })
        // Primary direction
        .mockResolvedValueOnce({ primaryDirection: 'Stay the course' })
        .mockResolvedValueOnce({ keyThemes: ['stability'] });

      const result = await creativeDirector.captureDirection(mockPatterns, 'interactive');

      expect(result.creativeLeaps).toHaveLength(0);
      expect(result.intuitions).toHaveLength(0);
      expect(result.primaryDirection).toBe('Stay the course');
    });
  });

  describe('Config-Driven Mode', () => {
    it('should process config without prompts', async () => {
      const config = {
        contradictions: [
          {
            patternId: 'contradiction-1',
            action: 'explore' as const,
            direction: 'Reframe as accessible premium',
          },
        ],
        whiteSpace: [
          {
            gapId: 'gap-1',
            decision: 'pursue' as const,
            reasoning: 'Strong market opportunity',
          },
        ],
        creativeLeaps: [
          {
            idea: 'Launch eco-luxury line',
            rationale: 'Market ready for sustainable premium',
          },
        ],
        intuitions: [
          {
            observation: 'Strong potential',
            context: 'Market research',
            confidence: 0.9,
          },
        ],
        primaryDirection: 'Lead in sustainable premium',
        keyThemes: ['sustainability', 'premium'],
      };

      const result = await creativeDirector.captureDirection(mockPatterns, 'config', config);

      expect(result).toBeDefined();
      expect(result.brandName).toBe('TestBrand');
      expect(result.selectedContradictions).toHaveLength(1);
      expect(result.whiteSpaceDecisions).toHaveLength(1);
      expect(result.creativeLeaps).toHaveLength(1);
      expect(result.intuitions).toHaveLength(1);
      expect(result.intuitions[0].confidence).toBe(0.9);
      expect(result.primaryDirection).toBe('Lead in sustainable premium');

      // Should NOT call inquirer in config mode
      expect(mockInquirer.prompt).not.toHaveBeenCalled();
    });
  });
});
