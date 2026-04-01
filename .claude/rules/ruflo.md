# Ruflo Development Tooling Rules

## Semantic Memory Search

Ruflo memory contains 117 indexed entries about VariScout's architecture, domain, conventions, and testing. Use it for deep codebase questions:

```bash
npx ruflo@3.5.42 memory search --query "your question here"
```

Common queries:
- `"Cpk calculation"` — finds stats engine entries
- `"Azure authentication Teams"` — finds auth architecture
- `"which persona needs admin"` — finds persona descriptions
- `"bottleneck analysis use case"` — finds use case details
- `"component extraction pattern"` — finds UI architecture conventions

## When to Use Ruflo Memory vs MEMORY.md

- **MEMORY.md**: Always-in-context routing (project state, key decisions, user preferences)
- **Ruflo memory**: Deep semantic search (domain knowledge, architecture details, 117 entries)

## When to Use Ruflo (Workflow)

- **Before feature work**: `mcp__ruflo__memory_search` for domain context and prior decisions
- **Before creating PR**: `mcp__ruflo__analyze_diff` for risk assessment + dispatch `testgaps` and `audit` workers
- **After major refactoring**: `npx ruflo@3.5.42 hooks pretrain` to reindex + update stale memory entries
- **Keep memory fresh**: Update entries when test counts, architecture, or conventions change

Full workflow: [ruflo-workflow.md](../../docs/05-technical/implementation/ruflo-workflow.md)

## After Major Codebase Changes

Run `npx ruflo@3.5.42 hooks pretrain` to refresh the codebase index. Then add specific entries:

```bash
npx ruflo@3.5.42 memory store --namespace architecture --key "change-name" --value "description"
```

## Background Workers

7 workers run periodically via `.ruflo/config.yaml`: `audit` (security), `testgaps` (coverage), `map` (structure), `optimize` (performance), `consolidate` (memory), `deepdive` (analysis), `refactor` (quality). 5 more available for manual dispatch via `mcp__ruflo__hooks_worker-dispatch`.

## Hook Error Logs

Hook errors are logged to `/tmp/ruflo-hooks.log`. Check if hooks are failing silently:

```bash
tail -20 /tmp/ruflo-hooks.log
```

## Documentation Health (integrated with docs:check)

- After feature delivery: run `bash scripts/check-doc-health.sh` to verify doc consistency
- After adding hooks/components: run `scripts/generate-monorepo-lists.ts` to sync lists (when available)
- After major changes: `npx ruflo@3.5.42 hooks pretrain` to reindex
- Store documentation conventions in ruflo memory for semantic search
- `document` worker in `.ruflo/config.yaml` monitors doc drift periodically

## Version

Ruflo is pinned to `3.5.42` in `.mcp.json`. `.claude/settings.json` contains hooks and statusline only (ruflo runtime config lives in `.ruflo/config.yaml`). Update monthly.
