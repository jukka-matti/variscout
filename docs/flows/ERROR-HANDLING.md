# Error Handling Flows

This document describes how VariScout Lite handles errors across different scenarios, with recovery patterns for each.

## Error Categories

| Category        | Examples                          | Severity      | User Impact         |
| --------------- | --------------------------------- | ------------- | ------------------- |
| Data Validation | Invalid format, missing columns   | Warning/Error | Blocks analysis     |
| File Operations | Upload failure, corrupt file      | Error         | Blocks data load    |
| Storage         | Quota exceeded, write failure     | Error         | Blocks save         |
| License         | Invalid key, expired              | Warning       | Feature restriction |
| Network         | Offline, sync failure             | Warning       | Degraded experience |
| Rendering       | Chart error, calculation overflow | Error         | Partial display     |

---

## Data Validation Errors

### Parser Errors

**Location**: `packages/core/src/parser.ts`

#### Missing Required Columns

```
Error: No measurement column detected
Context: CSV uploaded without numeric data column
```

**Flow**:

1. Parser scans all columns for numeric content
2. If no numeric column found, return validation error
3. Display DataQualityBanner with specific guidance
4. User can re-map columns manually or upload different file

**Recovery**:

- Show column preview with type detection
- Suggest which columns could be measurements
- Allow manual column selection

#### Invalid Numeric Values

```
Error: 15 non-numeric values in 'Weight' column
Context: Text values mixed with numbers
```

**Flow**:

1. Parser attempts numeric conversion
2. Track failed conversions with row numbers
3. Display warning banner with count
4. Proceed with valid values, mark invalid as excluded

**Recovery**:

- Show which rows have issues
- Option to exclude or include as missing
- Option to re-upload with corrected data

#### Specification Limit Issues

```
Warning: LSL (100) >= USL (95) - limits may be reversed
Context: Spec limits configured incorrectly
```

**Flow**:

1. Validate LSL < Target < USL relationship
2. Warn but don't block if reversed
3. Highlight in setup panel

**Recovery**:

- Auto-suggest swap if clearly reversed
- Allow manual correction
- Proceed with warning if user confirms

---

## File Operation Errors

### Upload Failures

**Location**: `apps/pwa/src/hooks/useDataIngestion.ts`

#### File Too Large

```
Error: File exceeds 50MB limit
Context: User uploads very large CSV
```

**Flow**:

1. Check file size before parsing
2. If over limit, reject with clear message
3. Suggest alternatives

**Recovery**:

- Suggest splitting file into smaller batches
- Recommend removing unnecessary columns
- Offer to sample first N rows for preview

#### Unsupported Format

```
Error: Unsupported file type: .xlsx (password protected)
Context: Encrypted Excel file uploaded
```

**Flow**:

1. Detect file type from extension and magic bytes
2. Attempt parse with appropriate parser
3. If encrypted or unsupported, show specific error

**Recovery**:

- List supported formats (.csv, .xlsx, .xls)
- For encrypted Excel, suggest saving unencrypted copy
- Offer CSV export instructions

#### Corrupt File

```
Error: Failed to parse file - invalid structure
Context: Truncated or corrupted file
```

**Flow**:

1. Parser throws during read
2. Catch and display user-friendly message
3. Log technical details for debugging

**Recovery**:

- Suggest re-downloading/re-exporting file
- Try alternative parser if available
- Offer to report issue with anonymized metadata

---

## Storage Errors

### IndexedDB Errors

**Location**: `apps/pwa/src/services/storage.ts`

#### Quota Exceeded

```
Error: Storage quota exceeded
Context: IndexedDB write fails due to space limits
```

**Flow**:

1. Catch QuotaExceededError on write
2. Display storage management UI
3. Suggest cleanup actions

**Recovery**:

- Show current storage usage breakdown
- Offer to delete old analyses
- Suggest browser storage settings

#### Database Unavailable

```
Error: IndexedDB not available in private browsing
Context: Safari private mode blocks IndexedDB
```

**Flow**:

1. Test IndexedDB availability on init
2. Fall back to sessionStorage (temporary)
3. Warn user data won't persist

**Recovery**:

- Explain private browsing limitation
- Suggest using normal browsing mode
- Offer export before closing

---

## License Validation Errors

### License Key Issues

**Location**: `packages/core/src/license.ts`

#### Invalid Key Format

```
Error: Invalid license key format
Context: Key doesn't match expected pattern
```

**Flow**:

1. Validate key format before API call
2. Highlight format requirements
3. Don't count as validation attempt

**Recovery**:

- Show expected format example
- Check for common issues (extra spaces, case)
- Link to license retrieval

#### Expired License

```
Warning: License expired on 2024-01-01
Context: Time-limited license past expiry
```

**Flow**:

1. Check expiry date in license data
2. Show warning but don't block usage
3. Offer renewal path

**Recovery**:

- Display days since expiry
- Link to renewal/purchase page
- Continue with Community edition features

#### Activation Limit Reached

```
Error: License already activated on 3 devices
Context: Per-license device limit hit
```

**Flow**:

1. Server returns activation limit error
2. Show device management option
3. Don't allow new activation

**Recovery**:

- List activated devices
- Offer to deactivate old device
- Explain device limit policy

---

## Network Errors

### Offline Scenarios

**Location**: `apps/azure/src/services/storage.ts`

#### Initial Load Offline

```
Info: Working offline - using cached data
Context: App loads without network connection
```

**Flow**:

1. Service worker serves cached app shell
2. Load data from IndexedDB
3. Show offline indicator
4. Queue any sync operations

**Recovery**:

- Automatic - app works offline
- Show last sync timestamp
- Queue changes for later sync

#### Sync Failure

```
Warning: OneDrive sync failed - changes saved locally
Context: Azure app can't reach OneDrive
```

**Flow**:

1. Attempt sync operation
2. Catch network error
3. Save to local queue
4. Show sync pending indicator

**Recovery**:

- Automatic retry when online
- Show pending changes count
- Allow manual retry

---

## Chart Rendering Errors

### Calculation Errors

**Location**: `packages/core/src/stats.ts`

#### Division by Zero

```
Error: Cannot calculate Cpk - zero standard deviation
Context: All values identical
```

**Flow**:

1. Detect zero std dev before division
2. Return special result indicator
3. Display appropriate message in chart

**Recovery**:

- Show "Cpk: undefined (no variation)" instead of error
- Explain why metric can't be calculated
- Still show other valid statistics

#### Numeric Overflow

```
Warning: Value exceeds safe integer range
Context: Extremely large numbers in data
```

**Flow**:

1. Detect values outside safe range
2. Scale or clamp for display
3. Note limitation in UI

**Recovery**:

- Display scaled values with notation
- Suggest data preprocessing
- Show full values in tooltip

### SVG Rendering Errors

**Location**: `packages/charts/src/`

#### Empty Data Set

```
Warning: No valid data points to display
Context: All points filtered out
```

**Flow**:

1. Detect empty data array
2. Show empty state component
3. Explain why chart is empty

**Recovery**:

- Show "No data" placeholder
- Suggest adjusting filters
- Offer to reset view

---

## Error Reporting Service

### Error Tracking

**Location**: `packages/ui/src/errorService.ts`

```typescript
interface ErrorReport {
  type: ErrorCategory;
  message: string;
  context: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;
}
```

### Error Boundary Pattern

```tsx
// apps/pwa/src/components/ErrorBoundary.tsx
<ErrorBoundary
  fallback={<ErrorFallback onRetry={handleRetry} />}
  onError={(error, info) => errorService.report(error, info)}
>
  <ChartContainer />
</ErrorBoundary>
```

---

## User Communication Patterns

### Error Message Guidelines

1. **Be specific**: "Column 'Weight' has 15 invalid values" not "Invalid data"
2. **Suggest action**: "Try removing text values or uploading a different file"
3. **Avoid blame**: "We couldn't process this file" not "You uploaded a bad file"
4. **Show technical details on demand**: Expandable for advanced users

### Severity Indicators

| Severity | Color | Icon             | Behavior                               |
| -------- | ----- | ---------------- | -------------------------------------- |
| Info     | Blue  | Info circle      | Dismissible, no action needed          |
| Warning  | Amber | Warning triangle | Dismissible, continues with limitation |
| Error    | Red   | X circle         | Blocks action, requires resolution     |

### Recovery UI Components

```tsx
// DataQualityBanner for validation issues
<DataQualityBanner
  issues={validationIssues}
  onDismiss={handleDismiss}
  onFix={handleAutoFix}
/>

// ErrorFallback for caught exceptions
<ErrorFallback
  error={error}
  onRetry={handleRetry}
  onReport={handleReport}
/>

// OfflineIndicator for network status
<OfflineIndicator
  isOnline={isOnline}
  pendingChanges={pendingCount}
  onSync={handleManualSync}
/>
```

---

## Testing Error Scenarios

### Unit Tests

```typescript
// packages/core/src/__tests__/parser.test.ts
describe('parser error handling', () => {
  it('returns validation error for empty file', () => {
    const result = parseCSV('');
    expect(result.errors).toContain('Empty file');
  });

  it('handles mixed numeric/text columns', () => {
    const result = parseCSV('value\n1\n2\ntext\n4');
    expect(result.warnings).toHaveLength(1);
    expect(result.data).toHaveLength(4);
  });
});
```

### Integration Tests

- Upload various malformed files
- Trigger storage quota scenarios
- Simulate offline conditions
- Test license validation edge cases
