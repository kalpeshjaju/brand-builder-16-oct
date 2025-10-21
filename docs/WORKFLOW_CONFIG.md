# Workflow Configuration

Define the execution pipeline in `config/workflow.json` (validated by `config/workflow.schema.json`).

Fields
- `features.useOracle` (boolean): enable/disable external semantic search
- `stages[]`: Ordered list of stages, each with `name` and `agents[]`
- `agents[].name`: Fully-qualified agent name (e.g., `evolution.research-blitz`)

Example
```json
{
  "$schema": "./workflow.schema.json",
  "features": { "useOracle": false },
  "stages": [
    {
      "name": "Discovery",
      "agents": [
        { "name": "evolution.research-blitz" },
        { "name": "evolution.pattern-presentation" }
      ]
    }
  ]
}
```

Tips
- Keep agent names stable to preserve compatibility
- New behavior = add a new agent; avoid rewriting existing ones
- Validate the JSON against the schema for quick feedback

