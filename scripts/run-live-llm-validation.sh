#!/bin/bash

# Live LLM Validation Script
#
# This script runs the brand evolution workshop (phases 3-5) against the
# live Anthropic API to validate the quality of the LLM's output.

# --- Configuration ---
BRAND_NAME="Flyberry"
BRAND_URL="https://flyberry.com"
COMPETITORS="https://competitor1.com https://competitor2.com"
OUTPUT_DIR="./outputs/live-llm-validation"
TRANSCRIPT_FILE="${OUTPUT_DIR}/validation-transcript.md"

# --- Pre-flight Checks ---
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "🔴 Error: ANTHROPIC_API_KEY is not set."
  echo "Please set the environment variable before running this script."
  exit 1
fi

# --- Script Execution ---
echo "🚀 Starting Live LLM Validation..."
echo "Brand: ${BRAND_NAME}"
echo "Output Directory: ${OUTPUT_DIR}"
echo "---"

# Clean up previous run
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

# Header for transcript file
{
  echo "# Live LLM Validation Transcript"
  echo ""
  echo "**Brand:** ${BRAND_NAME}"
  echo "**Date:** $(date)"
  echo ""
  echo "---"
  echo ""
} > "${TRANSCRIPT_FILE}"

# Function to run a phase and append output to transcript
run_phase() {
  local phase_name=$1
  local command=$2

  echo "Running Phase: ${phase_name}..."
  echo "## Phase: ${phase_name}" >> "${TRANSCRIPT_FILE}"
  echo "" >> "${TRANSCRIPT_FILE}"
  echo "\
```bash\n" >> "${TRANSCRIPT_FILE}"
  echo "$ ${command}" >> "${TRANSCRIPT_FILE}"
  echo "\
```\n" >> "${TRANSCRIPT_FILE}"
  echo "" >> "${TRANSCRIPT_FILE}"

  # Execute command and capture output
  eval "${command}" | tee -a "${TRANSCRIPT_FILE}"
  
  echo "" >> "${TRANSCRIPT_FILE}"
  echo "---" >> "${TRANSCRIPT_FILE}"
  echo "" >> "${TRANSCRIPT_FILE}"
  echo "✅ ${phase_name} complete."
  echo ""
}

# --- Phase Execution ---

# Run Phase 1 & 2 to generate prerequisites
echo "Running prerequisite phases (1 & 2)..."
npm run dev evolve present -- --brand "${BRAND_NAME}" --url "${BRAND_URL}" --competitors ${COMPETITORS} --output "${OUTPUT_DIR}" > /dev/null 2>&1
echo "✅ Prerequisites complete."
echo ""

# Phase 3: Creative Direction (Interactive)
echo "👉 Please follow the interactive prompts for Phase 3."
run_phase "Creative Direction" "npm run dev evolve direct -- --brand \"${BRAND_NAME}\" --output \"${OUTPUT_DIR}\""

# Phase 4: Validation
run_phase "Validation" "npm run dev evolve validate -- --brand \"${BRAND_NAME}\" --output \"${OUTPUT_DIR}\""

# Phase 5: Build-Out
run_phase "Build-Out" "npm run dev evolve build -- --brand \"${BRAND_NAME}\" --output \"${OUTPUT_DIR}\""

# --- Completion ---
echo "🎉 Live LLM Validation complete!"
echo "Transcript and outputs saved in: ${OUTPUT_DIR}"
echo "Please review the generated files and fill out the validation-report.md template."
