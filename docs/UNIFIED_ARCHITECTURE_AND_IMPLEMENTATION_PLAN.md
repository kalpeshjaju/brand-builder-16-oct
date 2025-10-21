# Unified Brand Builder: Architectural Design & Implementation Plan

**Version:** 1.0
**Date:** 2025-10-21
**Status:** Proposed
**Author:** Gemini

---

## 1. What: Vision, Goals, and Guiding Principles

### 1.1. Vision

To create a single, modular, and extensible brand-building platform that unifies the feature-rich workflow of `brand-builder-16-oct` with the powerful, scalable agentic orchestration framework of `agentic-brand-builder`.

The final product will be a highly flexible system capable of generating comprehensive brand strategies through a configurable pipeline of specialized AI agents.

### 1.2. Target Audience for this Document

*   **LLM Developers (Claude, Codex, Cursor, etc.):** To provide a clear, machine-readable blueprint for understanding the architecture and contributing new components (agents).
*   **Human Developers:** To serve as the source of truth for the system's design and implementation.
*   **Non-Technical Stakeholders:** To communicate the high-level structure and plan in an understandable way.

### 1.3. Guiding Principles

1.  **Modularity Over Monolith:** Every distinct capability (e.g., "PDF Extraction," "Competitor Analysis") will be an independent, interchangeable "agent."
2.  **Clarity and Simplicity:** The architecture and code will prioritize readability and simplicity to facilitate collaboration and reduce cognitive load for all contributors.
3.  **Configuration as Code:** The main workflow logic (the sequence of agents) will be defined in a simple, external configuration file, not in hard-coded logic.
4.  **Stateless Agents:** Agents will be stateless, receiving data, performing their task, and returning data. This makes them easy to test, reuse, and run in parallel.
5.  **Decoupled Infrastructure:** Core services (like file system access, LLM calls, and database access) will be provided to agents, not created by them.

---

## 2. How: Core Architecture & Detailed Component Design

The system will be built on a layered architecture to ensure a clear separation of concerns.

### 2.1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------+
|                      Layer 4: Input/Output                      |
|        (CLI, Future Web UI, HTML/PDF/JSON Report Generation)    |
+-----------------------------------------------------------------+
                              ^
                              |
+-----------------------------------------------------------------+
|                    Layer 3: Agentic Workflow                    |
| (MasterOrchestrator reads workflow.json and executes Agents)    |
+-----------------------------------------------------------------+
                              ^
                              | (Agents are "plugged in" here)
+-----------------------------------------------------------------+
|                       Layer 2: Agent Layer                      |
|  (A collection of stateless, modular Agents implementing IAgent) |
|  [Research] [Analysis] [Strategy] [Validation] [Generation]     |
+-----------------------------------------------------------------+
                              ^
                              | (Agents use these services)
+-----------------------------------------------------------------+
|                  Layer 1: Core Infrastructure                   |
|   (WorkspaceManager, LLMService, OracleClient, Logger, etc.)    |
+-----------------------------------------------------------------+
```

### 2.2. Detailed Project Structure (Proposed)

A new, clean project (`brand-builder-unified`) will be created with the following structure:

```
brand-builder-unified/
├── config/
│   └── workflow.json             # Defines the sequence of agents to run
├── docs/
│   └── UNIFIED_ARCHITECTURE.md   # This document
├── outputs/                      # All generated brand outputs will go here
├── src/
│   ├── agents/                   # All individual agent implementations
│   │   ├── IAgent.ts             # The master interface contract for all agents
│   │   ├── discovery/
│   │   │   └── ResearchBlitzAgent.ts
│   │   └── strategy/
│   │       └── CreativeDirectorAgent.ts
│   ├── infrastructure/           # Core, reusable services
│   │   ├── WorkspaceManager.ts   # Handles all file I/O
│   │   ├── LLMService.ts         # Centralized client for LLM calls
│   │   └── OracleClient.ts       # Centralized client for semantic search
│   ├── orchestrator/             # The engine that runs the workflow
│   │   ├── MasterOrchestrator.ts
│   │   └── AgentFactory.ts
│   ├── types/                    # Shared TypeScript types and interfaces
│   └── cli.ts                    # The main entry point for the CLI
├── package.json
└── tsconfig.json
```

### 2.3. The `IAgent` Interface: The Core Contract

This is the most critical component for enabling parallel development. **Every agent MUST implement this interface.**

```typescript
// src/agents/IAgent.ts

/**
 * The context object passed to every agent.
 * It contains all the data generated by previous agents and provides
 * access to core infrastructure services.
 */
export interface IAgentContext {
  brandName: string;
  workspace: WorkspaceManager; // For file system access
  llm: LLMService;             // For making LLM calls
  oracle: OracleClient;        // For semantic search
  results: Record<string, any>; // A dictionary of results from previous agents
}

/**
 * The standard result format for every agent.
 */
export interface IAgentResult {
  success: boolean;
  data: any;
  error?: string;
}

/**
 * The interface that every agent MUST implement.
 * Agents are stateless and receive all necessary context to perform their work.
 */
export interface IAgent {
  /**
   * A unique, descriptive name for the agent (e.g., "discovery.research-blitz").
   */
  name: string;

  /**
   * The main execution method for the agent.
   * @param context The shared context object containing all data and services.
   * @returns A promise that resolves with the agent's result.
   */
  execute(context: IAgentContext): Promise<IAgentResult>;
}
```

### 2.4. The Workflow Configuration (`config/workflow.json`)

This file defines the entire logic of the brand-building process. The `MasterOrchestrator` reads this file to determine which agents to run and in what order.

```json
{
  "stages": [
    {
      "name": "Discovery",
      "agents": [
        { "name": "discovery.research-blitz" },
        { "name": "discovery.pattern-presenter" }
      ]
    },
    {
      "name": "Strategy",
      "agents": [
        { "name": "strategy.creative-director" },
        { "name": "strategy.validation-engine" }
      ]
    },
    {
      "name": "Build-Out",
      "agents": [
        { "name": "generation.build-out-generator" }
      ]
    }
  ]
}
```

---

## 3. How to Build a New Agent: A Guide for LLM Collaborators

To add a new capability, you will create a new "agent." Follow these steps precisely.

**1. Create the Agent File:**
   Create a new TypeScript file in the appropriate subdirectory of `src/agents/`. For example: `src/agents/discovery/NewFeatureAgent.ts`.

**2. Implement the `IAgent` Interface:**
   Your new file must contain a class that implements the `IAgent` interface. Use the template below.

**3. Write the Agent's Logic:**
   Inside the `execute` method, add the logic for your feature. Use the services provided in the `context` object (`context.llm`, `context.workspace`, `context.oracle`) to perform actions.

**4. Register the Agent:**
   Open `src/orchestrator/AgentFactory.ts` and add your new agent class to the factory's list of known agents.

**5. Add the Agent to the Workflow:**
   Open `config/workflow.json` and add the `name` of your new agent to the desired stage in the pipeline.

### **Agent Template (Copy and Paste This):**

```typescript
// src/agents/discovery/NewFeatureAgent.ts

import { IAgent, IAgentContext, IAgentResult } from '../IAgent';

export class NewFeatureAgent implements IAgent {
  public name = 'discovery.new-feature';

  public async execute(context: IAgentContext): Promise<IAgentResult> {
    try {
      // 1. Get data from previous agents (if needed)
      const researchData = context.results['discovery.research-blitz'];

      // 2. Use infrastructure services (e.g., make an LLM call)
      const prompt = `Based on this research, do something new: ${JSON.stringify(researchData)}`;
      const llmResponse = await context.llm.prompt(prompt);

      // 3. Process the result
      const newData = { myFeature: llmResponse };

      // 4. Return the result in the standard format
      return {
        success: true,
        data: newData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: null,
      };
    }
  }
}
```

---

## 4. When: The Phased Implementation Plan

This project will be built in clear, sequential phases.

*   **Phase 1: Foundation & Unification (1-2 weeks)**
    *   **Goal:** Create the new `brand-builder-unified` project and migrate the core infrastructure and orchestration engine.
    *   **Tasks:**
        1.  Set up the new project structure.
        2.  Migrate `WorkspaceManager`, `LLMService`, and `OracleClient` from `brand-builder-16-oct`.
        3.  Migrate `MasterOrchestrator` and `AgentFactory` from `agentic-brand-builder`.
        4.  Create the `IAgent` interface and the `workflow.json` configuration file.

*   **Phase 2: First Agent Migration (1 week)**
    *   **Goal:** Prove the architecture by migrating the first complete feature into the new agent model.
    *   **Tasks:**
        1.  Create a `ResearchBlitzAgent` that wraps the logic from `research-blitz.ts`.
        2.  Run the orchestrator to execute this single agent and verify that it produces the same output as the original `brand-builder-16-oct`.

*   **Phase 3: Full Agent Migration (3-4 weeks)**
    *   **Goal:** Migrate all remaining features from `brand-builder-16-oct` and the implemented agents from `agentic-brand-builder` into the new agent structure.
    *   **Tasks:** Create and test agents for `PatternPresenter`, `CreativeDirector`, `ValidationEngine`, `BuildOutGenerator`, and all other existing capabilities.

*   **Phase 4: Output & UI/UX Enhancements (2 weeks)**
    *   **Goal:** Implement the user-facing improvements identified in the product design audit.
    *   **Tasks:**
        1.  Create a unified HTML report generator.
        2.  Implement the `setup` and `use` commands in the CLI.
        3.  Improve the formatting of all CLI outputs.

This plan provides a clear, structured path to building the unified brand builder. It is designed to be executed by a team of developers, whether human or AI.

Do you agree with this architectural design and implementation plan?
