import { useCallback, useEffect, useRef, useState } from 'react';

// Chart IDs that can be highlighted (must match PWA types)
export type ChartId = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression' | 'gagerr';

// Highlight intensity/style
export type HighlightIntensity = 'pulse' | 'glow' | 'border';

// Step data with optional chart target
export interface CaseStep {
  title: string;
  content: string;
  interactive: boolean;
  targetChart?: ChartId;
}

// Message types sent TO the PWA
interface EmbedMessage {
  type: 'variscout-embed';
  action: 'highlight-chart' | 'clear-highlight' | 'ping' | 'scroll-to-chart';
  payload?: {
    chartId?: ChartId;
    intensity?: HighlightIntensity;
  };
  messageId: string;
}

// Message types received FROM the PWA
interface EmbedResponse {
  type: 'variscout-embed-response';
  action: 'ready' | 'pong' | 'chart-clicked' | 'state-update' | 'highlight-applied';
  payload?: {
    chartId?: ChartId;
    success?: boolean;
  };
  messageId?: string;
}

interface CaseStudyControllerProps {
  iframeId: string;
  steps: CaseStep[];
  defaultIntensity?: HighlightIntensity;
  onReady?: () => void;
  onChartClicked?: (chartId: ChartId) => void;
}

// Generate unique message ID
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Type guard for EmbedResponse
function isEmbedResponse(data: unknown): data is EmbedResponse {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return msg.type === 'variscout-embed-response' && typeof msg.action === 'string';
}

export default function CaseStudyController({
  iframeId,
  steps,
  defaultIntensity = 'pulse',
  onReady,
  onChartClicked,
}: CaseStudyControllerProps) {
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<ChartId | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get iframe element reference
  useEffect(() => {
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    iframeRef.current = iframe;
  }, [iframeId]);

  // Send message to iframe
  const sendMessage = useCallback((message: Omit<EmbedMessage, 'messageId'>) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) {
      console.warn('[CaseStudyController] Iframe not available');
      return;
    }

    const fullMessage: EmbedMessage = {
      ...message,
      messageId: generateMessageId(),
    };

    try {
      iframe.contentWindow.postMessage(fullMessage, '*');
    } catch (err) {
      console.error('[CaseStudyController] Failed to send message:', err);
    }
  }, []);

  // Highlight a specific chart
  const highlightChart = useCallback(
    (chartId: ChartId, intensity: HighlightIntensity = defaultIntensity) => {
      if (!isIframeReady) return;

      setCurrentHighlight(chartId);
      sendMessage({
        type: 'variscout-embed',
        action: 'highlight-chart',
        payload: { chartId, intensity },
      });
    },
    [isIframeReady, sendMessage, defaultIntensity]
  );

  // Clear any active highlight
  const clearHighlight = useCallback(() => {
    if (!isIframeReady) return;

    setCurrentHighlight(null);
    sendMessage({
      type: 'variscout-embed',
      action: 'clear-highlight',
    });
  }, [isIframeReady, sendMessage]);

  // Scroll to a chart in the iframe
  const scrollToChart = useCallback(
    (chartId: ChartId) => {
      if (!isIframeReady) return;

      sendMessage({
        type: 'variscout-embed',
        action: 'scroll-to-chart',
        payload: { chartId },
      });
    },
    [isIframeReady, sendMessage]
  );

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isEmbedResponse(event.data)) return;

      const message = event.data;

      switch (message.action) {
        case 'ready':
          setIsIframeReady(true);
          onReady?.();
          break;

        case 'pong':
          // Ping response received - iframe is alive
          break;

        case 'chart-clicked':
          if (message.payload?.chartId) {
            onChartClicked?.(message.payload.chartId);
          }
          break;

        case 'highlight-applied':
          // Confirmation that highlight was applied
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReady, onChartClicked]);

  // Intersection Observer for step tracking
  useEffect(() => {
    if (!isIframeReady) return;

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when step is in middle of viewport
      threshold: 0,
    };

    let activeStepIndex: number | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        const stepIndex = parseInt(entry.target.getAttribute('data-step-index') || '-1', 10);
        if (stepIndex < 0) return;

        if (entry.isIntersecting) {
          // Debounce to prevent rapid switching
          if (debounceTimer) clearTimeout(debounceTimer);

          debounceTimer = setTimeout(() => {
            if (activeStepIndex !== stepIndex) {
              activeStepIndex = stepIndex;
              const step = steps[stepIndex];

              if (step?.targetChart) {
                highlightChart(step.targetChart);
              } else if (currentHighlight) {
                clearHighlight();
              }
            }
          }, 150);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe all step elements
    stepRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [isIframeReady, steps, highlightChart, clearHighlight, currentHighlight]);

  // Render step elements with refs for observation
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div
          key={index}
          ref={el => {
            stepRefs.current[index] = el;
          }}
          data-step-index={index}
          className={`
            flex gap-6 p-6 rounded-xl border transition-all duration-300
            ${
              step.interactive
                ? 'border-brand-primary bg-brand-primary/5'
                : 'border-neutral-200 bg-white'
            }
            ${
              step.targetChart && currentHighlight === step.targetChart
                ? 'ring-2 ring-brand-primary ring-offset-2'
                : ''
            }
          `}
        >
          <div
            className={`
              shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
              ${step.interactive ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}
            `}
          >
            {index + 1}
          </div>
          <div>
            <h3 className="font-bold mb-2">{step.title}</h3>
            <p className="text-neutral-600 leading-relaxed">{step.content}</p>
            {step.interactive && (
              <p className="text-sm text-brand-primary font-medium mt-2">
                &uarr; Try this in the interactive demo above
              </p>
            )}
            {step.targetChart && (
              <button
                type="button"
                onClick={() => {
                  highlightChart(step.targetChart!);
                  scrollToChart(step.targetChart!);
                }}
                className="mt-3 text-sm text-brand-primary hover:underline font-medium"
              >
                Show me the {step.targetChart === 'ichart' ? 'I-Chart' : step.targetChart}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
