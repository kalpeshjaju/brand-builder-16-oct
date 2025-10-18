#!/usr/bin/env tsx
// Script to index tryloop brand brief in ORACLE

import { createIngestionService } from '../src/ingestion/index.js';
import { logger } from '../src/utils/index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Indexing tryloop Brand Brief in ORACLE');
  console.log('='.repeat(60));

  try {
    const ingestion = createIngestionService();

    // Index the brand brief
    const result = await ingestion.ingestFile('test-data/tryloop-brand-brief.md', {
      brand: 'tryloop',
      indexInOracle: true,
    });

    if (!result.success) {
      throw new Error(result.errors?.join(', ') || 'Ingestion failed');
    }

    console.log('\n✓ Brand brief indexed successfully');
    console.log(`  File ID: ${result.fileId}`);
    console.log(`  Word Count: ${result.metadata.wordCount}`);
    console.log(`  Processing Time: ${result.processingTime}ms`);

    // Test search
    console.log('\nTesting context retrieval...');
    const context = await ingestion.searchContext(
      'tryloop',
      'What is tryloop\'s mission and core values?',
      500
    );

    console.log(`✓ Context retrieved: ${context.length} characters`);
    console.log('\nContext preview:');
    console.log(context.substring(0, 300) + '...\n');

    console.log('='.repeat(60));
    console.log('✓ Ready for RAG-enhanced generation!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('✗ Error:', (error as Error).message);
    process.exit(1);
  }
}

main();
