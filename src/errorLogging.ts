import { getBridge } from './pcBridge';

type RendererLogLevel = 'debug' | 'info' | 'warn' | 'error';

let installed = false;

function safeSerialize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof Event) {
    return {
      type: value.type,
      target: value.target instanceof HTMLElement ? value.target.tagName : null,
    };
  }

  if (value && typeof value === 'object') {
    const seen = new WeakSet();
    try {
      return JSON.parse(JSON.stringify(value, (_key, nested) => {
        if (nested instanceof Error) return safeSerialize(nested);
        if (nested && typeof nested === 'object') {
          if (seen.has(nested)) return '[Circular]';
          seen.add(nested);
        }
        return nested;
      }));
    } catch {
      return String(value);
    }
  }

  return value;
}

function sendRendererLog(level: RendererLogLevel, source: string, message: string, data?: unknown) {
  const bridge = getBridge();
  if (!bridge?.logs) return;

  void bridge.logs.rendererLog({
    level,
    source,
    message,
    data: safeSerialize(data),
    ts: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }).catch(() => {});
}

export function logRendererError(source: string, error: unknown, data?: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  sendRendererLog('error', source, message, {
    error: safeSerialize(error),
    data: safeSerialize(data),
  });
}

export function installRendererErrorLogging() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    sendRendererLog('error', 'renderer:error', event.message || 'Window error', {
      error: safeSerialize(event.error),
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logRendererError('renderer:unhandledrejection', event.reason);
  });

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    originalError(...args);
    sendRendererLog('error', 'renderer:console.error', args.map(String).join(' '), args);
  };

  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    sendRendererLog('warn', 'renderer:console.warn', args.map(String).join(' '), args);
  };
}
