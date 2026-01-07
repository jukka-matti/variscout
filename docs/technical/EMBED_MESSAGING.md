# PWA Embed Messaging Protocol

Communication protocol for iframe-embedded PWA on the marketing website.

## Overview

PostMessage-based bidirectional communication between the marketing website and embedded PWA iframe. Used for case study pages to synchronize chart highlights with step content.

## Security

- **Origin validation**: Only accepts messages from `variscout.com`, `*.variscout.com`, and `localhost`
- **Message prefixing**: All messages use `variscout-embed` type prefix
- **No sensitive data**: Only UI state (chart IDs, highlight styles) transmitted

## Message Types

### Website → PWA (EmbedMessage)

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

### PWA → Website (EmbedResponse)

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

## Integration

### PWA Side (useEmbedMessaging hook)

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

### Website Side (CaseStudyController)

Location: `apps/website/src/components/CaseStudyController.tsx`

```typescript
// Send highlight message to iframe
const highlightChart = (chartId: ChartId, intensity: HighlightIntensity) => {
  iframe.contentWindow.postMessage(
    {
      type: 'variscout-embed',
      action: 'highlight-chart',
      payload: { chartId, intensity },
      messageId: generateMessageId(),
    },
    '*'
  );
};

// Listen for ready message
window.addEventListener('message', event => {
  if (event.data.type === 'variscout-embed-response') {
    if (event.data.action === 'ready') {
      setIsIframeReady(true);
    }
  }
});
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
│   Website   │                      │     PWA     │
│  (parent)   │                      │  (iframe)   │
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
- `apps/website/src/components/CaseStudyController.tsx` - Website message sender
- `apps/website/src/components/PWAEmbed.astro` - Iframe container
