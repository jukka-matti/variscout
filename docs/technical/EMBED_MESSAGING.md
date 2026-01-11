# PWA Embed Messaging Protocol

Communication protocol for iframe-embedded PWA (when used externally).

## Overview

PostMessage-based bidirectional communication for when the PWA is embedded in an iframe by third parties. The protocol enables parent windows to control chart highlights and receive interaction events.

> **Note:** The VariScout marketing website no longer uses iframe embedding. As of the React Islands migration, the website renders charts directly using `@variscout/charts` components with data from `@variscout/data`. This protocol remains available for third-party integrations or external documentation sites that want to embed the PWA.

## Security

- **Origin validation**: Only accepts messages from `variscout.com`, `*.variscout.com`, and `localhost`
- **Message prefixing**: All messages use `variscout-embed` type prefix
- **No sensitive data**: Only UI state (chart IDs, highlight styles) transmitted

## Message Types

### Parent → PWA (EmbedMessage)

```typescript
interface EmbedMessage {
  type: 'variscout-embed';
  action: 'highlight-chart' | 'clear-highlight' | 'ping' | 'scroll-to-chart';
  payload?: {
    chartId?: ChartId;
    intensity?: HighlightIntensity;
  };
  messageId: string;
}
```

| Action            | Payload                  | Description              |
| ----------------- | ------------------------ | ------------------------ |
| `highlight-chart` | `{ chartId, intensity }` | Highlight specific chart |
| `clear-highlight` | -                        | Remove all highlights    |
| `ping`            | -                        | Health check             |
| `scroll-to-chart` | `{ chartId }`            | Scroll chart into view   |

### PWA → Parent (EmbedResponse)

```typescript
interface EmbedResponse {
  type: 'variscout-embed-response';
  action: 'ready' | 'pong' | 'chart-clicked' | 'highlight-applied';
  payload?: {
    chartId?: ChartId;
    success?: boolean;
  };
  messageId?: string;
}
```

| Action              | Payload       | Description                       |
| ------------------- | ------------- | --------------------------------- |
| `ready`             | -             | PWA loaded and ready for messages |
| `pong`              | -             | Response to ping                  |
| `chart-clicked`     | `{ chartId }` | User clicked a chart              |
| `highlight-applied` | `{ success }` | Confirmation of highlight action  |

## Chart IDs

```typescript
type ChartId = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression' | 'gagerr';
```

| ID           | Chart                               |
| ------------ | ----------------------------------- |
| `ichart`     | I-Chart (Individuals Control Chart) |
| `boxplot`    | Box Plot                            |
| `pareto`     | Pareto Chart                        |
| `stats`      | Statistics Panel                    |
| `regression` | Regression Panel                    |
| `gagerr`     | Gage R&R Panel                      |

## Highlight Intensities

```typescript
type HighlightIntensity = 'pulse' | 'glow' | 'border';
```

| Intensity | CSS Class                 | Description                     |
| --------- | ------------------------- | ------------------------------- |
| `pulse`   | `.chart-highlight-pulse`  | Animated pulsing ring (default) |
| `glow`    | `.chart-highlight-glow`   | Soft blue glow effect           |
| `border`  | `.chart-highlight-border` | Simple 2px border               |

## PWA Integration (useEmbedMessaging hook)

Location: `apps/pwa/src/hooks/useEmbedMessaging.ts`

```typescript
import { useEmbedMessaging } from './hooks/useEmbedMessaging';

function App() {
  const [isEmbedMode] = useState(/* check ?embed=true */);

  const {
    highlightedChart,    // Currently highlighted chart ID
    highlightIntensity,  // Current highlight style
    isReady,             // Whether messaging is initialized
    notifyChartClicked,  // Callback when user clicks chart
  } = useEmbedMessaging(isEmbedMode);

  return (
    <Dashboard
      highlightedChart={highlightedChart}
      highlightIntensity={highlightIntensity}
      onChartClick={isEmbedMode ? notifyChartClicked : undefined}
    />
  );
}
```

## Third-Party Integration Example

For external sites wanting to embed the PWA:

```html
<iframe
  id="variscout-embed"
  src="https://app.variscout.com?embed=true&sample=coffee"
  width="100%"
  height="600"
></iframe>

<script>
  const iframe = document.getElementById('variscout-embed');

  // Wait for PWA to be ready
  window.addEventListener('message', event => {
    if (event.data.type === 'variscout-embed-response') {
      if (event.data.action === 'ready') {
        console.log('PWA ready for commands');
      }
    }
  });

  // Send highlight command
  function highlightChart(chartId) {
    iframe.contentWindow.postMessage(
      {
        type: 'variscout-embed',
        action: 'highlight-chart',
        payload: { chartId, intensity: 'pulse' },
        messageId: crypto.randomUUID(),
      },
      '*'
    );
  }
</script>
```

## Debugging

### Console Logging

Messages are logged with `[EmbedMessaging]` prefix:

- `[EmbedMessaging] Rejected message from: <origin>` - Origin validation failed
- `[EmbedMessaging] Failed to send message: <error>` - PostMessage error
- `[EmbedMessaging] Unknown action: <action>` - Unrecognized action

### DevTools Tips

1. Open iframe in separate tab to see its console
2. Use Network tab to verify iframe loads
3. Check Application > Frames to inspect iframe origin

## Flow Diagram

```
┌─────────────┐                      ┌─────────────┐
│   Parent    │                      │     PWA     │
│  (embedder) │                      │  (iframe)   │
└─────────────┘                      └─────────────┘
       │                                    │
       │         iframe loads               │
       │ ◄──────────────────────────────────│
       │                                    │
       │         { action: 'ready' }        │
       │ ◄──────────────────────────────────│
       │                                    │
       │    { action: 'highlight-chart',    │
       │      payload: { chartId: 'boxplot' │
       │                 intensity: 'pulse'}}│
       │ ──────────────────────────────────►│
       │                                    │
       │    { action: 'highlight-applied',  │
       │      payload: { success: true }}   │
       │ ◄──────────────────────────────────│
       │                                    │
       │    User clicks chart               │
       │                                    │
       │    { action: 'chart-clicked',      │
       │      payload: { chartId: 'boxplot'}}│
       │ ◄──────────────────────────────────│
       │                                    │
```

## Related Files

- `apps/pwa/src/hooks/useEmbedMessaging.ts` - PWA message handler
- `apps/pwa/src/components/Dashboard.tsx` - Highlight prop consumer
- `apps/pwa/src/index.css` - Highlight CSS classes

## Marketing Website Architecture (React Islands)

The VariScout marketing website uses a different architecture that doesn't require iframe messaging:

- **React Islands**: Chart components render directly on the page using Astro's `client:only="react"` directive
- **Data Package**: Pre-computed sample data from `@variscout/data`
- **Chart Components**: Direct imports from `@variscout/charts`

See [Case Components](../products/website/components/CASE-COMPONENTS.md) for the current website architecture.
