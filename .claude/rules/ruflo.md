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

## After Major Codebase Changes

Run `npx ruflo@3.5.42 hooks pretrain` to refresh the codebase index. Then add specific entries:

```bash
npx ruflo@3.5.42 memory store --namespace architecture --key "change-name" --value "description"
```

## Hook Error Logs

Hook errors are logged to `/tmp/ruflo-hooks.log`. Check if hooks are failing silently:

```bash
tail -20 /tmp/ruflo-hooks.log
```

## Version

Ruflo is pinned to `3.5.42` in `.mcp.json`. `.claude/settings.json` contains hooks and statusline only (ruflo runtime config lives in `.ruflo/config.yaml`). Update monthly.
