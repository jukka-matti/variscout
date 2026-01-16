# Feedback Patterns

Status, loading, and error state patterns.

## Loading States

### Button Loading

```jsx
<button disabled className="flex items-center gap-2">
  <Loader2 className="animate-spin" size={16} />
  Saving...
</button>
```

### Full Page Loading

```jsx
<div className="flex items-center justify-center h-full">
  <div className="flex flex-col items-center gap-4">
    <Loader2 className="animate-spin text-blue-500" size={32} />
    <span className="text-slate-400">Loading data...</span>
  </div>
</div>
```

### Skeleton Placeholder

```jsx
<div className="animate-pulse">
  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
  <div className="h-4 bg-slate-700 rounded w-1/2" />
</div>
```

## Empty States

### No Data

```jsx
<div className="flex flex-col items-center justify-center h-full text-center p-8">
  <FileX className="text-slate-600 mb-4" size={48} />
  <h3 className="text-lg font-semibold text-slate-300 mb-2">No data loaded</h3>
  <p className="text-sm text-slate-500 mb-4">Import a CSV or Excel file to get started</p>
  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Import Data</button>
</div>
```

### No Results

```jsx
<div className="flex items-center justify-center h-full text-slate-500 text-sm">
  No matching data found
</div>
```

### No Selection

```jsx
<div className="flex items-center justify-center h-full text-slate-500">
  Select an outcome variable to view analysis
</div>
```

### Actionable Empty State

For chart panels that can be configured or hidden:

```jsx
<div className="flex flex-col items-center justify-center h-full text-slate-400">
  <BarChart3 className="opacity-50 mb-2" size={32} />
  <p className="text-sm mb-3">No Pareto data</p>
  <div className="flex gap-2">
    <button className="text-xs px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">
      Select Factor
    </button>
    <button className="text-xs px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">Upload</button>
    <button className="text-xs px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">Hide</button>
  </div>
</div>
```

Use when:

- Chart requires data/configuration that isn't present
- User should have options to configure, upload, or dismiss the panel
- Hiding is temporary (resets on new data)

## Success States

### Inline Success

```jsx
<span className="flex items-center gap-1 text-green-500 text-sm">
  <Check size={14} />
  Saved successfully
</span>
```

### Success Badge

```jsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
  <Check size={12} />
  Pass
</span>
```

## Error States

### Inline Error

```jsx
<span className="text-xs text-red-400 mt-1">Invalid value entered</span>
```

### Error Card

```jsx
<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
    <div>
      <h4 className="text-sm font-medium text-red-400">Error loading data</h4>
      <p className="text-xs text-red-300/80 mt-1">Please check the file format and try again.</p>
    </div>
  </div>
</div>
```

### Error Boundary Fallback

```jsx
<div className="flex flex-col items-center justify-center h-full p-6 text-center">
  <AlertCircle className="text-red-400 mb-4" size={32} />
  <h3 className="text-white font-medium mb-2">Something went wrong</h3>
  <p className="text-sm text-slate-400 mb-4">{componentName} failed to render</p>
  <button onClick={reset} className="text-blue-400 hover:underline">
    Try again
  </button>
</div>
```

## Warning States

### Warning Banner

```jsx
<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
  <AlertTriangle className="text-amber-400 flex-shrink-0" size={18} />
  <span className="text-sm text-amber-200">Large dataset may affect performance</span>
</div>
```

## Status Badges

```jsx
// Pass (green)
<span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
  Pass
</span>

// Fail (red)
<span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
  Fail
</span>

// Warning (amber)
<span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
  Warning
</span>
```

## Copy Feedback

```jsx
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

<button className={copied ? 'text-green-400' : 'text-slate-400'}>
  {copied ? <Check size={16} /> : <Copy size={16} />}
</button>;
```

## Saving Indicator

```jsx
<span className="flex items-center gap-2 text-xs text-slate-500">
  {isSaving ? (
    <>
      <Loader2 className="animate-spin" size={12} />
      Saving...
    </>
  ) : hasUnsavedChanges ? (
    <>
      <span className="w-2 h-2 bg-amber-500 rounded-full" />
      Unsaved changes
    </>
  ) : (
    <>
      <Check size={12} />
      Saved
    </>
  )}
</span>
```

## Unsaved Changes Indicator

Show asterisk after project name:

```jsx
<span className="text-slate-500">
  {projectName}
  {hasUnsavedChanges && ' *'}
</span>
```
