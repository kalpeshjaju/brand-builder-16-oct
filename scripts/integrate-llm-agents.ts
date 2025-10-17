#!/usr/bin/env tsx
/**
 * Automated LLM Integration Script
 * Applies LLM integration pattern to template-generated agents
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

interface AgentInfo {
  path: string;
  name: string;
  module: string;
  description: string;
  hasPlaceholder: boolean;
  isManuallyImplemented: boolean;
}

/**
 * Scan agent files to identify template-generated ones
 */
function scanAgents(baseDir: string): AgentInfo[] {
  const agents: AgentInfo[] = [];
  const modules = ['discovery', 'strategy', 'generation', 'validation', 'analysis'];

  for (const module of modules) {
    const agentsDir = join(baseDir, 'src', module, 'agents');
    try {
      const files = readdirSync(agentsDir).filter(f => f.endsWith('-agent.ts'));

      for (const file of files) {
        const path = join(agentsDir, file);
        const content = readFileSync(path, 'utf-8');

        // Skip agents that already have LLM integration
        if (content.includes('if (this.llmService)') && content.includes('this.llmService.analyze(')) {
          console.log(`  ⏭️  Skipping ${file} (already integrated)`);
          continue;
        }

        // Extract agent name and description
        const nameMatch = content.match(/name: '([^']+)'/);
        const descMatch = content.match(/description: '([^']+)'/);

        const hasPlaceholder = content.includes('void data; // Mark as intentionally unused in placeholder');
        const isManuallyImplemented = content.includes('void marketData') ||
                                     content.includes('void competitorData') ||
                                     content.includes('void brandData');

        agents.push({
          path,
          name: nameMatch?.[1] || file.replace('-agent.ts', ''),
          module,
          description: descMatch?.[1] || '',
          hasPlaceholder,
          isManuallyImplemented,
        });
      }
    } catch (error) {
      // Module directory might not exist yet
    }
  }

  return agents;
}

/**
 * Generate LLM prompt based on agent description
 */
function generatePrompt(agent: AgentInfo): string {
  const context = agent.module === 'discovery' ? 'market and competitive intelligence' :
                 agent.module === 'strategy' ? 'brand strategy and positioning' :
                 agent.module === 'generation' ? 'content and creative assets' :
                 agent.module === 'validation' ? 'quality assurance and validation' :
                 'brand analysis and insights';

  return `Analyze ${agent.description.toLowerCase()} for \${_data.brandName}.

Brand Context:
- Brand Name: \${_data.brandName}
- Brand URL: \${_data.brandUrl || 'Not specified'}
- Industry: \${_data.context?.industry || 'Not specified'}
- Target Market: \${_data.context?.targetMarket || 'Not specified'}

Context from ${agent.module} module focusing on ${context}.

Previous Analysis Context:
\${_data.previousAnalyses?.length > 0 ? JSON.stringify(_data.previousAnalyses.map((a: any) => ({
  type: a.type,
  summary: a.summary,
})), null, 2) : 'No previous analysis available'}

Provide comprehensive analysis for: ${agent.description}

Return as JSON matching this structure:
{
  "summary": "Overall analysis summary",
  "findings": [
    {
      "type": "insight",
      "description": "key finding",
      "impact": "high|medium|low",
      "confidence": 0-1
    }
  ],
  "score": 0-10,
  "recommendations": ["recommendation1", "recommendation2"],
  "metadata": {
    "analysisType": "${agent.name.toLowerCase().replace(/\s+/g, '_')}",
    "timestamp": "ISO timestamp"
  }
}`;
}

/**
 * Apply LLM integration to a template agent
 */
function integrateAgent(agent: AgentInfo): boolean {
  try {
    let content = readFileSync(agent.path, 'utf-8');

    // Find the performAnalysis method
    const methodRegex = /private async performAnalysis\(_data: any\): Promise<\w+Result> \{[\s\S]*?^  \}/m;
    const methodMatch = content.match(methodRegex);

    if (!methodMatch) {
      console.log(`  ⚠️  Could not find performAnalysis method in ${basename(agent.path)}`);
      return false;
    }

    const originalMethod = methodMatch[0];

    // Extract the return type
    const returnTypeMatch = originalMethod.match(/Promise<(\w+)>/);
    const returnType = returnTypeMatch?.[1] || 'any';

    // Generate the new method with LLM integration
    const prompt = generatePrompt(agent);

    const newMethod = `private async performAnalysis(_data: any): Promise<${returnType}> {
    // Use LLM for intelligent analysis if available
    if (this.llmService) {
      try {
        const prompt = \`${prompt}\`;

        const response = await this.llmService.analyze(prompt, '${agent.name.toLowerCase().replace(/\s+/g, '-')}');

        if (response && response.summary) {
          return {
            summary: response.summary || '${agent.description}',
            findings: response.findings || [],
            score: response.score || 7.5,
            confidence: response.confidence || 8,
            recommendations: response.recommendations || [],
            metadata: {
              analysisType: '${agent.name.toLowerCase().replace(/\s+/g, '_')}',
              timestamp: new Date().toISOString(),
              ...response.metadata,
            },
          };
        }
      } catch (error) {
        this.log(\`LLM analysis failed, using fallback: \${error}\`, 'warn');
      }
    }

    // Fallback to placeholder implementation
    const data = _data; // Alias for function body usage
    void data; // Mark as intentionally unused in placeholder
    // This is a placeholder implementation

    const analysis: ${returnType} = {
      summary: '${agent.description}',
      findings: [
        {
          type: 'insight',
          description: 'Key finding from ${agent.name.toLowerCase()} analysis',
          impact: 'high',
          confidence: 0.85,
        },
      ],
      score: 7.5,
      confidence: 8,
      recommendations: [],
      metadata: {
        analysisType: '${agent.name.toLowerCase().replace(/\s+/g, '_')}',
        timestamp: new Date().toISOString(),
      },
    };

    return analysis;
  }`;

    // Replace the method
    content = content.replace(methodRegex, newMethod);

    // Write back
    writeFileSync(agent.path, content, 'utf-8');

    console.log(`  ✅ Integrated ${basename(agent.path)}`);
    return true;
  } catch (error) {
    console.log(`  ❌ Failed to integrate ${basename(agent.path)}: ${error}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting LLM Integration Automation\n');

  const baseDir = process.cwd();
  console.log('📁 Scanning agents...\n');

  const agents = scanAgents(baseDir);

  console.log(`\nFound ${agents.length} agents to integrate:\n`);

  // Categorize agents
  const templateAgents = agents.filter(a => a.hasPlaceholder && !a.isManuallyImplemented);
  const manualAgents = agents.filter(a => a.isManuallyImplemented);
  const complexAgents = agents.filter(a => !a.hasPlaceholder && !a.isManuallyImplemented);

  console.log(`📊 Agent Categories:`);
  console.log(`  - Template agents (auto-integrate): ${templateAgents.length}`);
  console.log(`  - Manual agents (skip): ${manualAgents.length}`);
  console.log(`  - Complex agents (review): ${complexAgents.length}\n`);

  // Process template agents
  console.log('🔄 Processing template agents:\n');
  let successCount = 0;
  let failCount = 0;

  for (const agent of templateAgents) {
    const success = integrateAgent(agent);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n✨ Integration Complete!`);
  console.log(`  ✅ Successfully integrated: ${successCount} agents`);
  console.log(`  ❌ Failed: ${failCount} agents`);

  if (manualAgents.length > 0) {
    console.log(`  ⏭️  Skipped (already integrated): ${manualAgents.length} agents`);
  }

  if (complexAgents.length > 0) {
    console.log(`\n⚠️  Complex agents requiring manual review:`);
    complexAgents.forEach(a => {
      console.log(`  - ${a.name} (${a.module})`);
    });
  }

  console.log(`\n📝 Next Steps:`);
  console.log(`  1. Run: npm run type-check`);
  console.log(`  2. Run: npm test`);
  console.log(`  3. Review and test integrated agents`);
  console.log(`  4. Commit changes to git\n`);
}

main().catch(console.error);
