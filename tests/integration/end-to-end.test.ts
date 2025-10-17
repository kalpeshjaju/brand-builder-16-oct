/**
 * End-to-End Integration Tests
 * Tests full multi-agent workflows with real/mock LLM integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MarketResearcherAgent } from '../../src/discovery/agents/market-researcher-agent.js';
import { CompetitorAnalyzerAgent } from '../../src/discovery/agents/competitor-analyzer-agent.js';
import { PersonaCreatorAgent } from '../../src/strategy/agents/persona-creator-agent.js';
import { MockLLMService, ClaudeLLMService } from '../../src/services/llm-service.js';

describe('End-to-End Integration Tests', () => {
  describe('Discovery Module Workflow', () => {
    it('should run market research analysis', async () => {
      const llm = new MockLLMService();
      const agent = new MarketResearcherAgent(llm);

      const result = await agent.analyze({
        brandName: 'TestBrand',
        brandUrl: 'https://testbrand.com',
        data: {
          industry: 'Technology',
          category: 'SaaS',
          geography: 'Global',
          marketSize: '$100B',
        },
      });

      expect(result.status).toBe('success');
      expect(result.findings).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should run competitor analysis', async () => {
      const llm = new MockLLMService();
      const agent = new CompetitorAnalyzerAgent(llm);

      const result = await agent.analyze({
        brandName: 'TestBrand',
        data: {
          competitors: ['Competitor A', 'Competitor B'],
          industry: 'Technology',
        },
      });

      expect(result.status).toBe('success');
      expect(result.findings).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Strategy Module Workflow', () => {
    it('should create customer personas', async () => {
      const llm = new MockLLMService();
      const agent = new PersonaCreatorAgent(llm);

      const result = await agent.analyze({
        brandName: 'TestBrand',
        brandUrl: 'https://testbrand.com',
        context: {
          industry: 'Technology',
          targetMarket: 'B2B',
        },
      });

      expect(result.status).toBe('success');
      expect(result.findings).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Multi-Agent Workflow', () => {
    it('should run sequential agent pipeline', async () => {
      const llm = new MockLLMService();

      // Step 1: Market Research
      const marketAgent = new MarketResearcherAgent(llm);
      const marketResult = await marketAgent.analyze({
        brandName: 'TestBrand',
        data: { industry: 'Technology' },
      });

      expect(marketResult.status).toBe('success');

      // Step 2: Competitor Analysis (uses market data)
      const competitorAgent = new CompetitorAnalyzerAgent(llm);
      const competitorResult = await competitorAgent.analyze({
        brandName: 'TestBrand',
        data: {
          competitors: ['CompetitorA'],
          marketData: marketResult.findings,
        },
        previousAgentOutputs: [marketResult],
      });

      expect(competitorResult.status).toBe('success');

      // Step 3: Persona Creation (uses both)
      const personaAgent = new PersonaCreatorAgent(llm);
      const personaResult = await personaAgent.analyze({
        brandName: 'TestBrand',
        context: { industry: 'Technology' },
        previousAgentOutputs: [marketResult, competitorResult],
      });

      expect(personaResult.status).toBe('success');
    });
  });

  describe('Real Claude API Integration (Optional)', () => {
    it.skip('should work with real Claude API when API key available', async () => {
      // Skip by default - only run when ANTHROPIC_API_KEY is set
      if (!process.env['ANTHROPIC_API_KEY']) {
        return;
      }

      const llm = new ClaudeLLMService({
        apiKey: process.env['ANTHROPIC_API_KEY'],
      });

      const agent = new MarketResearcherAgent(llm);
      const result = await agent.analyze({
        brandName: 'TestBrand',
        data: {
          industry: 'Technology',
          category: 'SaaS',
        },
      });

      expect(result.status).toBe('success');
      expect(result.findings).toBeDefined();
      // Real API should provide rich analysis
      expect(result.confidence).toBeGreaterThan(7);
    }, 30000); // 30s timeout for API calls
  });

  describe('Error Handling', () => {
    it('should handle missing required data gracefully', async () => {
      const llm = new MockLLMService();
      const agent = new MarketResearcherAgent(llm);

      const result = await agent.analyze({
        brandName: 'TestBrand',
        // Missing data field
      });

      // Should still return a result, not crash
      expect(result).toBeDefined();
      expect(['success', 'error']).toContain(result.status);
    });

    it('should handle LLM service failures gracefully', async () => {
      // Create a mock that throws errors
      const failingLLM = {
        async prompt() {
          throw new Error('API Error');
        },
        async analyze() {
          throw new Error('API Error');
        },
        async generate() {
          throw new Error('API Error');
        },
        async validate() {
          throw new Error('API Error');
        },
      };

      const agent = new MarketResearcherAgent(failingLLM);
      const result = await agent.analyze({
        brandName: 'TestBrand',
        data: { industry: 'Technology' },
      });

      // Should fallback to placeholder data
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });
});
