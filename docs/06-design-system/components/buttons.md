# Buttons

Button variants for PWA and Excel Add-in.

## PWA Buttons (Tailwind)

### Primary Button

```jsx
<button className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Save Project
</button>
```

### Secondary Button

```jsx
<button className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium px-4 py-2 rounded-lg transition-colors">
  Cancel
</button>
```

### Danger Button

```jsx
<button className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Delete
</button>
```

### Ghost Button

```jsx
<button className="text-slate-400 hover:text-white hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
  Reset
</button>
```

### Icon Button

```jsx
<button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
  <Settings size={18} />
</button>
```

### Small Button

```jsx
<button className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
  Apply
</button>
```

## Button States

### Disabled

```jsx
<button disabled className="... disabled:opacity-50 disabled:cursor-not-allowed">
  Saving...
</button>
```

### Loading

```jsx
<button disabled className="... flex items-center gap-2">
  <Loader2 className="animate-spin" size={16} />
  Saving...
</button>
```

### Active/Selected

```jsx
<button
  className={`... ${
    isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
  }`}
>
  Option
</button>
```

## Tab Buttons

```jsx
<div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
  <button
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      activeTab === 'summary'
        ? 'bg-slate-700 text-white shadow-sm'
        : 'text-slate-400 hover:text-slate-300'
    }`}
  >
    Summary
  </button>
</div>
```

## Touch Targets

For mobile, ensure minimum 44px touch targets:

```jsx
<button className="p-2 ..." style={{ minWidth: 44, minHeight: 44 }}>
  <Icon size={18} />
</button>
```

## Website Buttons (CSS Classes)

The website uses CSS component classes (defined in `apps/website/src/styles/global.css`) instead of inline Tailwind classes (PWA) or Fluent UI components (Excel).

### Variants

```html
<!-- Primary — main CTAs -->
<a class="btn btn-primary" href="/pricing">Get Started</a>

<!-- Secondary — alternative actions on light backgrounds -->
<a class="btn btn-secondary" href="/tools">Explore Tools</a>

<!-- Outline — subtle actions on light backgrounds -->
<a class="btn btn-outline" href="/learn">Learn More</a>

<!-- Outline Light — actions on dark backgrounds (hero, footer) -->
<a class="btn btn-outline-light" href="/cases">Case Studies</a>
```

### Touch Targets

The base `.btn` class uses `py-2.5` (~40px height). For primary CTAs on landing pages, override to `py-3` to meet the 44px minimum touch target:

```html
<a class="btn btn-primary py-3">Start Free</a>
```

## Excel Add-in Buttons (Fluent UI)

```tsx
import { Button } from '@fluentui/react-components';

// Primary
<Button appearance="primary">Save</Button>

// Secondary
<Button appearance="secondary">Cancel</Button>

// Subtle (ghost)
<Button appearance="subtle">Reset</Button>

// With icon
<Button icon={<SaveRegular />}>Save</Button>
```

## Copy Feedback Button

Pattern for copy-to-clipboard with visual feedback:

```jsx
const [copied, setCopied] = useState(false);

<button
  onClick={handleCopy}
  className={`p-1.5 rounded transition-all ${
    copied ? 'bg-green-500/20 text-green-400' : 'text-slate-500 hover:text-white hover:bg-slate-700'
  }`}
>
  {copied ? <Check size={16} /> : <Copy size={16} />}
</button>;
```
