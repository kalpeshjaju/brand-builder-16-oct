# Oracle and Context Manager Implementation Plan

**Version:** 1.0
**Date:** 2025-10-21
**Status:** Proposed

---

## 1. Executive Summary

This document outlines a phased implementation plan for two major architectural enhancements: the **Oracle Engine** (for semantic search) and the **Context Manager** (for state persistence and knowledge management). These features are currently placeholders in the `UNIFIED_ARCHITECTURE.md` and are critical for unlocking the next level of capabilities for the Brand Builder Pro tool.

The implementation is designed to be iterative, delivering value at each stage and minimizing disruption to the existing codebase.

---

## 2. Goals and Objectives

*   **Goal 1: Implement a robust Context Manager.**
    *   **Objective 1.1:** Persist the state of the evolution workshop, allowing users to resume their work.
    *   **Objective 1.2:** Create a structured workspace for each brand to manage inputs, outputs, and knowledge.
    *   **Objective 1.3:** Establish a foundation for a knowledge graph that can track the relationships between different pieces of information.

*   **Goal 2: Implement the Oracle Engine for semantic search.**
    *   **Objective 2.1:** Enable users to perform semantic searches over their brand's knowledge base.
    *   **Objective 2.2:** Integrate the Oracle Engine with the evolution workshop to provide context-aware suggestions.
    *   **Objective 2.3:** Create a document ingestion pipeline to populate the Oracle's knowledge base.

---

## 3. Proposed Architecture

The proposed architecture will be implemented in TypeScript, with a Python bridge for the vector store to leverage existing libraries for performance and simplicity.

### 3.1. Context Manager

*   **Storage:** A combination of the file system for storing large artifacts (like reports and raw data) and a lightweight database (like SQLite) for managing metadata and state.
*   **State Management:** The `EvolutionWorkflowState` will be saved to a JSON file within the brand's workspace at the end of each phase. The orchestrator will be updated to load this state when resuming a workshop.
*   **Workspace Structure:** A dedicated directory will be created for each brand, containing subdirectories for inputs, outputs, logs, and the context database.

### 3.2. Oracle Engine

*   **Vector Store:** We will use ChromaDB as the vector store. It's open-source, easy to set up, and has good support for Python.
*   **Python Bridge:** A simple Python script will be created to handle the interaction with ChromaDB. This script will expose a simple API over a child process to the main TypeScript application.
*   **Document Ingestion:** A new `ingest` command will be added to the CLI. This command will be able to process various file types (PDF, DOCX, MD), extract text, generate embeddings (using the Anthropic API), and store them in the vector store.
*   **Retrieval:** A new `search` command will be added to the CLI to allow users to query the vector store. The retrieval engine will also be exposed as a service to other parts of the application.

---

## 4. Implementation Phases

This project will be broken down into four distinct phases.

### Phase 1: Context Manager Foundation (Estimated Time: 3-4 days)

*   **Task 1.1:** Implement the brand workspace structure.
    *   Create a `WorkspaceManager` class that handles the creation and management of brand-specific directories.
    *   Update the `init` command to use the `WorkspaceManager`.
*   **Task 1.2:** Implement state persistence.
    *   Modify the `EvolutionOrchestrator` to save the `EvolutionWorkflowState` to a `workflow-state.json` file at the end of each phase.
    *   Implement the logic to load this state when the `evolve` command is run with a `--resume` flag.
*   **Task 1.3:** Refactor file output.
    *   Update all file output operations to use the `WorkspaceManager` to save files to the correct brand directory.

### Phase 2: Document Ingestion (Estimated Time: 4-5 days)

*   **Task 2.1:** Implement the Python bridge for ChromaDB.
    *   Create a Python script that uses the `chromadb-client` library to connect to a ChromaDB instance.
    *   Expose functions for adding documents and searching.
*   **Task 2.2:** Implement the document parsing logic.
    *   Create parser classes for PDF, DOCX, and Markdown files.
    *   These parsers will extract text content from the files.
*   **Task 2.3:** Implement the `ingest` command.
    *   Create a new `ingest` command that takes a file path as input.
    *   The command will use the appropriate parser to extract text, call the Anthropic API to generate embeddings, and then use the Python bridge to store the embeddings in ChromaDB.

### Phase 3: Oracle Engine - Search and Retrieval (Estimated Time: 2-3 days)

*   **Task 3.1:** Implement the `search` command.
    *   Create a new `search` command that takes a query as input.
    *   The command will generate an embedding for the query, use the Python bridge to search ChromaDB, and then display the results.
*   **Task 3.2:** Create a `RetrievalEngine` service.
    *   Encapsulate the search logic into a `RetrievalEngine` class that can be used by other parts of the application.

### Phase 4: Integration with Evolution Workshop (Estimated Time: 3-4 days)

*   **Task 4.1:** Integrate the `RetrievalEngine` with the `CreativeDirector`.
    *   During the interactive creative direction phase, use the `RetrievalEngine` to search for relevant information from the knowledge base based on the user's input.
    *   Present these "contextual suggestions" to the user to help them make more informed decisions.
*   **Task 4.2:** Use the `RetrievalEngine` to enrich the build-out phase.
    *   In the `BuildOutGenerator`, use the `RetrievalEngine` to find relevant proof points and examples from the knowledge base to incorporate into the final strategy document.

---

## 5. Next Steps

*   Review and approve this implementation plan.
*   Begin work on Phase 1: Context Manager Foundation.

I will start by creating the `WorkspaceManager` class and updating the `init` command.
