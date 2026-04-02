---
title: 'Knowledge Tab & CoScout Inline Citation Preview'
date: 2026-04-02
status: draft
audience: [developer, designer]
category: architecture
related: [adr-060, adr-049, adr-057, knowledge-base, coscout, pi-panel]
---

# Knowledge Tab & CoScout Inline Citation Preview

## Problem Statement

ADR-060 introduces a unified knowledge system where CoScout can search uploaded documents and investigation artifacts. Two UX gaps remain:

1. **No management surface** for reference documents (SOPs, FMEAs, specs). Analysts need a place to upload, view, download, and delete documents.
2. **No citation verification** flow. When CoScout cites a document or finding, the analyst has no way to verify the source inline.

## Decision

Two complementary UI surfaces:

- **Document Shelf** — A "Docs" tab in the PI panel (Team tier only) for managing reference documents. Simple file list with upload, download, delete. Not a knowledge browser — CoScout handles search.
- **CoScout Inline Citation Preview** — Extends ADR-057 Visual Grounding to knowledge sources. Clickable `[REF:document:id]` links in CoScout messages expand inline preview cards showing the cited chunk text.

**Design principle**: The Document Shelf manages documents; CoScout uses them. Citation verification stays in the conversation flow. No overlap, no competition.

## Document Shelf (PI Panel "Docs" Tab)

### Placement

Conditional 4th primary tab in the PI panel tab bar:

- **Team tier**: Shown as "Docs" with badge count (document count)
- **Standard / PWA**: Hidden (no tab rendered)

Tab type added to `PITab`: `'stats' | 'questions' | 'journal' | 'docs'`

### Layout (top → bottom)

| Zone               | Content                                                          | Scroll Behavior        |
| ------------------ | ---------------------------------------------------------------- | ---------------------- |
| Drop zone          | Dashed border area with "Drop files or browse" + file type hints | Pinned (never scrolls) |
| Filter input       | 🔍 icon + text input + clear (×) button                          | Pinned (never scrolls) |
| Document list      | Alphabetical file rows with metadata + actions                   | Scrollable             |
| Auto-index summary | "CoScout also searches: N findings · M answers"                  | Pinned at bottom       |

### Document Row

Each row displays:

- **File type icon** (📄 PDF, 📊 XLSX, 📝 DOCX, 📋 CSV/TXT) in a colored badge
- **Filename** (bold, truncated with ellipsis if too long)
- **Metadata line**: file size · uploader display name · upload date
- **Actions**: Download (↓) and Delete (×) buttons, visible on row

### Sort & Filter

- **Sort**: Always alphabetical by filename (A→Z). No user-configurable sort.
- **Filter**: Client-side, case-insensitive substring match on filename. Highlights matching text in results. Shows "N of M documents" when filtered. Clear button (×) in input.
- **Empty filter result**: "No documents match '{query}'"

### Empty State

When no documents exist, the drop zone expands with guidance text:

> Upload reference documents (SOPs, specs, FMEAs) so CoScout can cite them during investigation.

### Upload

- **Drop zone**: Accepts drag/drop of files. Visual feedback on dragover (border color change to blue).
- **Browse button**: Opens native file picker with accept filter.
- **Supported types**: PDF, XLSX, DOCX, CSV, TXT, Markdown (same as `SUPPORTED_ATTACHMENT_TYPES` in `fileValidation.ts`, excluding images)
- **Size limit**: 10 MB per file
- **Validation**: Client-side via `validateAttachmentFile()` before upload. Error shown inline below drop zone.
- **Upload flow**: File → POST `/api/kb-upload` with projectId + file → stored in Blob `documents/{docId}-{filename}` → Foundry IQ auto-indexes on next cycle → document appears in list
- **Progress**: Upload spinner replaces drop zone during upload. Returns to drop zone on complete.
- **Multi-file**: Support multiple files in one drop. Upload sequentially. Progress shows "Uploading 2 of 5..."

### Delete

- Delete button (×) shows confirmation: "Remove {filename}? CoScout will no longer be able to cite this document."
- DELETE `/api/kb-delete` removes from Blob. Foundry IQ auto-removes from index on next cycle.
- Row removed from list immediately (optimistic UI).

### Download

- Download button (↓) fetches original file from Blob Storage via SAS token.
- Opens browser download dialog.

### Auto-Index Summary

Footer line showing what CoScout additionally searches beyond uploaded documents:

> CoScout also searches: 3 findings · 2 answers · 1 conclusion

ℹ icon opens a tooltip explaining: "Investigation artifacts (findings, answered questions, conclusions) are automatically indexed and searchable by CoScout. Manage them in the Questions and Journal tabs."

### Beta Badge

`PreviewBadge` component shown next to tab label when `isPreviewEnabled('knowledge-base')` is true. Same pattern as existing preview features.

## CoScout Inline Citation Preview

### REF Marker Extension (ADR-057)

CoScout already uses `[REF:type:id]text[/REF]` markers for chart elements. Extend with new reference types:

| REF Type   | Source                  | Example                                                          |
| ---------- | ----------------------- | ---------------------------------------------------------------- |
| `document` | Uploaded document chunk | `[REF:document:doc-123]SOP-103 §4.2[/REF]`                       |
| `finding`  | Investigation finding   | `[REF:finding:f-456]Night shift Cpk drop[/REF]` (already exists) |
| `answer`   | Question answer         | `[REF:answer:a-789]Pekka's nozzle observation[/REF]`             |

Rendered as clickable blue links with source type icon (📄, 📌, 💬) — same styling as existing chart REF links.

### Inline Preview Card

Clicking a knowledge REF link expands an inline preview card below the CoScout message. The card is visually indented (left margin) to show it belongs to the message above.

**Document preview card** (blue border):

- Header: File type icon + filename + section reference + Download button + Close (×)
- Body: The specific text chunk that was cited (italic, 3-4 lines max, scrollable if longer)
- Footer: "Chunk N of M · file size · uploader · date"

**Finding preview card** (amber border):

- Header: 📌 icon + finding text + status badge (observed/investigating/resolved)
- Body: Outcome (if resolved: effective/partial/not + Cpk delta) + comment count + linked question text
- No download button (findings are not files)

**Answer preview card** (blue border, lighter):

- Header: 💬 icon + answer text excerpt + source badge ("answer")
- Body: Full answer text + "Answer to: {question text}" + attachment indicator if document attached
- Download button if document attachment exists

### Interaction

- **Click REF link** → expand preview card (toggle: click again to collapse)
- **Auto-expand**: First document REF per message auto-expands (same as ADR-057 auto-highlight, 100ms delay)
- **Close (×)** → collapse preview card
- **Download** → fetch original file from Blob
- **Multiple previews**: Only one expanded per message. Clicking another collapses the previous.

### No Tab Navigation

Clicking a knowledge REF does NOT switch to the Docs tab. The inline preview provides all needed context. The analyst stays in the CoScout conversation flow.

## Components

### New Components (in `@variscout/ui`)

| Component               | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `DocumentShelfBase`     | Docs tab content: drop zone + filter + list + summary     |
| `DocumentRow`           | Single document row with metadata + actions               |
| `DocumentDropZone`      | Drag/drop upload area with validation                     |
| `KnowledgeCitationCard` | Inline preview card for document/finding/answer citations |
| `AutoIndexSummary`      | Footer showing investigation artifact counts              |

### Modified Components

| Component                | Change                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `PIPanelBase`            | Add `'docs'` to `PITab`, render `DocumentShelfBase` when active, conditional on Team tier      |
| `PIOverflowMenu`         | No change (Docs is a primary tab, not overflow)                                                |
| `CoScoutMessages`        | Parse `[REF:document:*]` and `[REF:answer:*]` markers, render `KnowledgeCitationCard` on click |
| `RefLink` (from ADR-057) | Add `document` and `answer` to supported REF types, add 📄/💬 icons                            |

### Hooks

| Hook               | Purpose                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `useDocumentShelf` | Document list state, upload, delete, filter. Calls `/api/kb-*` endpoints. |

## Files

### Create

- `packages/ui/src/components/DocumentShelf/DocumentShelfBase.tsx`
- `packages/ui/src/components/DocumentShelf/DocumentRow.tsx`
- `packages/ui/src/components/DocumentShelf/DocumentDropZone.tsx`
- `packages/ui/src/components/DocumentShelf/AutoIndexSummary.tsx`
- `packages/ui/src/components/CoScoutPanel/KnowledgeCitationCard.tsx`
- `packages/hooks/src/useDocumentShelf.ts`

### Modify

- `packages/ui/src/components/ProcessIntelligencePanel/types.ts` — add `'docs'` to `PITab`
- `packages/ui/src/components/ProcessIntelligencePanel/PIPanelBase.tsx` — add Docs tab button + content rendering
- `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx` — parse document/answer REF markers
- `packages/core/src/ai/prompts/coScout.ts` — add `document` and `answer` REF types to system prompt instructions

## Mobile Behavior

- **Docs tab**: Full-width list. Drop zone becomes "Upload" button (no drag/drop on mobile). Filter input remains.
- **Inline citation**: Preview cards render full-width below messages. Same tap-to-expand behavior.

## What's NOT in Scope

- **Inline document viewer** (PDF.js, spreadsheet renderer) — download and open in OS viewer for v1
- **Document editing** — read-only; delete and re-upload to update
- **Cross-project document sharing** — per-project only
- **Document versioning** — single version per file; delete + re-upload for updates
- **Knowledge tab search** (searching content) — that's CoScout's job via `search_knowledge_base`

## Verification

### Unit Tests

- `DocumentShelfBase` renders drop zone, filter, document list, auto-index summary
- `DocumentRow` shows filename, metadata, download/delete buttons
- `DocumentDropZone` accepts valid files, rejects invalid types/sizes
- `KnowledgeCitationCard` renders document/finding/answer variants with correct styling
- `useDocumentShelf` manages upload, delete, filter state
- Filter matches case-insensitive substring, highlights match text
- List is always alphabetically sorted

### Integration Tests

- Upload file → appears in document list alphabetically
- Delete file → removed from list immediately
- Filter input → list shows matching documents only
- Docs tab hidden for non-Team tier
- CoScout REF click → inline preview card expands with correct content

### E2E Verification

- Upload SOP via Docs tab → CoScout cites it in next conversation → click citation → inline preview shows chunk text → download works
