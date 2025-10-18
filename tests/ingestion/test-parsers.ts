// Parser Integration Tests

import { PDFParser } from '../../src/ingestion/parsers/pdf-parser.js';
import { DOCXParser } from '../../src/ingestion/parsers/docx-parser.js';
import { createIngestionService } from '../../src/ingestion/ingestion-service.js';
import { createOracleClient } from '../../src/oracle/index.js';
import { logger } from '../../src/utils/index.js';

async function testPDFParser() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: PDF Parser');
  console.log('='.repeat(60));

  try {
    const parser = new PDFParser();

    // Test with tryloop brand brief (if PDF exists)
    const testFile = 'test-data/tryloop-brand-brief.pdf';

    console.log(`\nParsing: ${testFile}`);
    const result = await parser.parse(testFile, {
      extractTables: true,
      preserveFormatting: false,
    });

    console.log(`✓ PDF parsed successfully`);
    console.log(`  Raw text length: ${result.raw.length} characters`);
    console.log(`  Cleaned text length: ${result.cleaned.length} characters`);
    console.log(`  Sections: ${result.structured.sections?.length || 0}`);
    console.log(`  Headings: ${result.structured.headings?.length || 0}`);
    console.log(`  Tables: ${result.structured.tables?.length || 0}`);

    if (result.structured.headings && result.structured.headings.length > 0) {
      console.log(`\n  First 5 headings:`);
      result.structured.headings.slice(0, 5).forEach((h, i) => {
        console.log(`    ${i + 1}. ${h}`);
      });
    }

    console.log(`\n  Content preview:`);
    console.log(`    ${result.cleaned.substring(0, 200)}...`);

    return true;
  } catch (error) {
    console.log(`✗ PDF parser test failed: ${(error as Error).message}`);
    return false;
  }
}

async function testDOCXParser() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: DOCX Parser');
  console.log('='.repeat(60));

  try {
    const parser = new DOCXParser();

    // Test with tryloop brand brief (if DOCX exists)
    const testFile = 'test-data/tryloop-brand-brief.docx';

    console.log(`\nParsing: ${testFile}`);
    const result = await parser.parse(testFile, {
      extractTables: true,
      preserveFormatting: false,
    });

    console.log(`✓ DOCX parsed successfully`);
    console.log(`  Raw text length: ${result.raw.length} characters`);
    console.log(`  Cleaned text length: ${result.cleaned.length} characters`);
    console.log(`  Sections: ${result.structured.sections?.length || 0}`);
    console.log(`  Headings: ${result.structured.headings?.length || 0}`);
    console.log(`  Tables: ${result.structured.tables?.length || 0}`);

    if (result.structured.headings && result.structured.headings.length > 0) {
      console.log(`\n  First 5 headings:`);
      result.structured.headings.slice(0, 5).forEach((h, i) => {
        console.log(`    ${i + 1}. ${h}`);
      });
    }

    console.log(`\n  Content preview:`);
    console.log(`    ${result.cleaned.substring(0, 200)}...`);

    return true;
  } catch (error) {
    console.log(`✗ DOCX parser test failed: ${(error as Error).message}`);
    return false;
  }
}

async function testIngestionService() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Ingestion Service');
  console.log('='.repeat(60));

  try {
    const ingestion = createIngestionService();

    // Test markdown file (no indexing first)
    const testFile = 'test-data/tryloop-brand-brief.md';

    console.log(`\nIngesting (no ORACLE): ${testFile}`);
    const result = await ingestion.ingestFile(testFile, {
      brand: 'tryloop',
      indexInOracle: false,
    });

    if (!result.success) {
      throw new Error(result.errors?.join(', ') || 'Ingestion failed');
    }

    console.log(`✓ File ingested successfully`);
    console.log(`  File ID: ${result.fileId}`);
    console.log(`  Format: ${result.format}`);
    console.log(`  Word count: ${result.metadata.wordCount}`);
    console.log(`  Processing time: ${result.processingTime}ms`);
    console.log(`  Title: ${result.metadata.title}`);

    return true;
  } catch (error) {
    console.log(`✗ Ingestion service test failed: ${(error as Error).message}`);
    return false;
  }
}

async function testOracleIntegration() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Parser → ORACLE Integration');
  console.log('='.repeat(60));

  try {
    // Check if ORACLE is running
    const oracle = createOracleClient();
    const isRunning = await oracle.isRunning();

    if (!isRunning) {
      console.log('⚠️  ORACLE service not running - skipping integration test');
      console.log('   Start ORACLE: cd oracle-service && python3 main.py');
      return true; // Don't fail test if ORACLE isn't running
    }

    const ingestion = createIngestionService({ oracleClient: oracle });

    // Test with markdown file and ORACLE indexing
    const testFile = 'test-data/tryloop-brand-brief.md';

    console.log(`\nIngesting with ORACLE indexing: ${testFile}`);
    const result = await ingestion.ingestFile(testFile, {
      brand: 'tryloop-test',
      indexInOracle: true,
    });

    if (!result.success) {
      throw new Error(result.errors?.join(', ') || 'Ingestion failed');
    }

    console.log(`✓ File ingested and indexed in ORACLE`);
    console.log(`  File ID: ${result.fileId}`);
    console.log(`  Word count: ${result.metadata.wordCount}`);

    // Test search
    console.log(`\nTesting semantic search...`);
    const context = await ingestion.searchContext(
      'tryloop-test',
      'What is tryloop\'s mission and core values?',
      1000
    );

    console.log(`✓ Context retrieved from ORACLE`);
    console.log(`  Context length: ${context.length} characters`);
    console.log(`  Context preview:`);
    console.log(`    ${context.substring(0, 200)}...`);

    // Cleanup
    console.log(`\nCleaning up test data...`);
    await oracle.clear('tryloop-test');
    console.log(`✓ Test data cleared`);

    return true;
  } catch (error) {
    console.log(`✗ ORACLE integration test failed: ${(error as Error).message}`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('PARSER & INGESTION TEST SUITE');
  console.log('='.repeat(60));

  const results: Record<string, boolean> = {};

  // Run tests
  results['DOCX Parser'] = await testDOCXParser();
  results['PDF Parser'] = await testPDFParser();
  results['Ingestion Service'] = await testIngestionService();
  results['ORACLE Integration'] = await testOracleIntegration();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${test}`);
  }

  console.log(`\nTotal: ${passed}/${total} tests passed (${Math.round(100 * passed / total)}%)`);
  console.log('='.repeat(60));

  process.exit(passed === total ? 0 : 1);
}

main();
