/**
 * Guardian Stack - Enhanced fact-checking and verification
 *
 * Exports:
 * - FactCheckerEnhanced: Validates claims against multiple sources
 * - CrossSourceVerifier: Checks consistency across sources
 */

export { FactCheckerEnhanced, type FactCheckConfig, type FactCheckReport } from './fact-checker-enhanced.js';
export { CrossSourceVerifier, type CrossSourceConfig, type VerificationResult, type Conflict } from './cross-source-verifier.js';
