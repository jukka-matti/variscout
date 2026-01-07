# PWA Embed Mode

Configuration and behavior when PWA is embedded in an iframe on the marketing website.

## Activation

Add URL parameters to enable embed mode:

```
/app?embed=true&sample=bottleneck
```

## URL Parameters

| Parameter    | Required | Description               |
| ------------ | -------- | ------------------------- |
| `embed=true` | Yes      | Enables embed mode        |
| `sample=xxx` | No       | Auto-loads sample dataset |

### Sample Keys

| Key             | Dataset                     |
| --------------- | --------------------------- |
| `bottleneck`    | Process bottleneck analysis |
| `hospital-ward` | Hospital occupancy data     |
| `coffee`        | Coffee moisture levels      |
| `packaging`     | Packaging defects           |
| `avocado`       | Avocado coating study       |

## Behavior Changes

When `embed=true`:

| Feature              | Normal Mode   | Embed Mode          |
| -------------------- | ------------- | ------------------- |
| App Header           | Visible       | Hidden              |
| App Footer           | Visible       | Hidden              |
| PostMessage listener | Inactive      | Active              |
| Chart click events   | Internal only | Forwarded to parent |
| Filter bar           | Visible       | Hidden              |

## Highlight System

Charts can be highlighted via PostMessage from the parent window.

### CSS Classes

```css
/* Pulsing animation (default) */
.chart-highlight-pulse {
  animation: chart-pulse 1.5s ease-in-out infinite;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Soft glow effect */
.chart-highlight-glow {
  box-shadow:
    0 0 20px rgba(59, 130, 246, 0.4),
    0 0 40px rgba(59, 130, 246, 0.2);
  border-color: #3b82f6 !important;
}

/* Simple border */
.chart-highlight-border {
  border: 2px solid #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
```

### Reduced Motion

Animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .chart-highlight-pulse {
    animation: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
}
```

## Hook: useEmbedMessaging

Location: `apps/pwa/src/hooks/useEmbedMessaging.ts`

### Usage

```typescript
import { useEmbedMessaging } from './hooks/useEmbedMessaging';

const {
  highlightedChart, // ChartId | null
  highlightIntensity, // 'pulse' | 'glow' | 'border'
  isReady, // boolean
  clearHighlight, // () => void
  notifyChartClicked, // (chartId: ChartId) => void
} = useEmbedMessaging(isEmbedMode);
```

### Return Values

| Property             | Type                    | Description                 |
| -------------------- | ----------------------- | --------------------------- |
| `highlightedChart`   | `ChartId \| null`       | Currently highlighted chart |
| `highlightIntensity` | `HighlightIntensity`    | Current highlight style     |
| `isReady`            | `boolean`               | Whether hook is initialized |
| `clearHighlight`     | `() => void`            | Clears active highlight     |
| `notifyChartClicked` | `(id: ChartId) => void` | Notifies parent of click    |

## Dashboard Integration

The Dashboard component accepts highlight props:

```typescript
interface DashboardProps {
  highlightedChart?: ChartId | null;
  highlightIntensity?: HighlightIntensity;
  onChartClick?: (chartId: ChartId) => void;
}
```

### Chart Wrapper Pattern

Each chart is wrapped with data attributes for targeting:

```tsx
<div
  data-chart-id="boxplot"
  onClick={() => handleChartWrapperClick('boxplot')}
  className={`... ${getHighlightClass('boxplot')}`}
>
  <Boxplot ... />
</div>
```

## Keyboard Support

- **Escape**: Clears active highlight and notifies parent

## Security

### Origin Validation

Only accepts messages from allowed origins:

```typescript
const allowedPatterns = [
  window.location.origin,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/(www\.)?variscout\.com$/,
  /^https?:\/\/.*\.variscout\.com$/,
];
```

### Message Validation

Type guard ensures message structure:

```typescript
function isEmbedMessage(data: unknown): data is EmbedMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === 'variscout-embed' &&
    typeof msg.action === 'string' &&
    typeof msg.messageId === 'string'
  );
}
```

## Testing

### Manual Testing

1. Open `/app?embed=true&sample=bottleneck`
2. Verify header/footer hidden
3. Open DevTools console
4. Send test message:

```javascript
window.postMessage(
  {
    type: 'variscout-embed',
    action: 'highlight-chart',
    payload: { chartId: 'boxplot', intensity: 'pulse' },
    messageId: 'test-1',
  },
  '*'
);
```

### Expected Console Output

```
[EmbedMessaging] Received: highlight-chart
```

## Related Documentation

- [Embed Messaging Protocol](../../technical/EMBED_MESSAGING.md)
- [Case Study Components](../website/components/CASE-COMPONENTS.md)
