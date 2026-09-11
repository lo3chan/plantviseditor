/**
 * debugLogger.ts
 * In-memory circular debug logger capturing runtime console logs, unhandled errors,
 * unhandled promise rejections, and environment telemetry for the Bug Submission Tool.
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
}

export interface SystemTelemetry {
  timestamp: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  windowInnerSize: string;
  devicePixelRatio: number;
  url: string;
  online: boolean;
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

class DebugLoggerService {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isInitialized: boolean = false;
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Preserve original console methods
    const originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    };

    const intercept = (level: LogEntry['level'], origFn: (...args: any[]) => void) => {
      return (...args: any[]) => {
        try {
          origFn(...args);
        } catch {
          // ignore
        }

        try {
          const message = args
            .map(arg => {
              if (arg === null) return 'null';
              if (arg === undefined) return 'undefined';
              if (typeof arg === 'string') return arg;
              if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            })
            .join(' ');

          const entry: LogEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: new Date().toISOString(),
            level,
            message
          };

          this.addEntry(entry);
        } catch {
          // Fallback to prevent recursive errors
        }
      };
    };

    console.log = intercept('log', originalConsole.log);
    console.info = intercept('info', originalConsole.info);
    console.warn = intercept('warn', originalConsole.warn);
    console.error = intercept('error', originalConsole.error);
    console.debug = intercept('debug', originalConsole.debug);

    // Global window error listener
    window.addEventListener('error', (event) => {
      try {
        const error = event.error;
        const entry: LogEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Unhandled Window Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
          stack: error?.stack || ''
        };
        this.addEntry(entry);
      } catch {
        // ignore
      }
    });

    // Global unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      try {
        const reason = event.reason;
        const message = reason instanceof Error 
          ? `${reason.name}: ${reason.message}` 
          : String(reason);
        const stack = reason instanceof Error ? reason.stack : undefined;

        const entry: LogEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Unhandled Promise Rejection: ${message}`,
          stack
        };
        this.addEntry(entry);
      } catch {
        // ignore
      }
    });

    this.logCustom('info', 'DebugLogger initialized. Capturing console and environment telemetry.');
  }

  public logCustom(level: LogEntry['level'], message: string, data?: any): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    this.addEntry(entry);
  }

  private addEntry(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.listeners.forEach(fn => {
      try {
        fn(entry);
      } catch {
        // ignore listener errors
      }
    });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
  }

  public subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getTelemetry(): SystemTelemetry {
    if (typeof window === 'undefined') {
      return {
        timestamp: new Date().toISOString(),
        userAgent: 'SSR / Unknown',
        platform: 'Node',
        language: 'en',
        screenResolution: '0x0',
        windowInnerSize: '0x0',
        devicePixelRatio: 1,
        url: '',
        online: true
      };
    }

    const perfMem = (performance as any)?.memory;

    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent || 'Unknown',
      platform: (navigator as any).userAgentData?.platform || navigator.platform || 'Unknown',
      language: navigator.language || 'en',
      screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      windowInnerSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      url: window.location.href,
      online: navigator.onLine,
      memory: perfMem ? {
        usedJSHeapSize: Math.round(perfMem.usedJSHeapSize / (1024 * 1024)),
        totalJSHeapSize: Math.round(perfMem.totalJSHeapSize / (1024 * 1024)),
        jsHeapSizeLimit: Math.round(perfMem.jsHeapSizeLimit / (1024 * 1024))
      } : undefined
    };
  }

  public formatLogFile(extraContext?: Record<string, any>): string {
    const telemetry = this.getTelemetry();
    const lines: string[] = [
      '========================================================================',
      '           PLANTUML VISUAL STUDIO - SYSTEM & DEBUG LOG REPORT           ',
      '========================================================================',
      `Generated At:     ${telemetry.timestamp}`,
      `User Agent:       ${telemetry.userAgent}`,
      `Platform:         ${telemetry.platform}`,
      `Language:         ${telemetry.language}`,
      `Screen Res:       ${telemetry.screenResolution}`,
      `Viewport Size:    ${telemetry.windowInnerSize} (DPR: ${telemetry.devicePixelRatio})`,
      `Active URL:       ${telemetry.url}`,
      `Network Online:   ${telemetry.online ? 'YES' : 'NO'}`
    ];

    if (telemetry.memory) {
      lines.push(`JS Heap Memory:   ${telemetry.memory.usedJSHeapSize} MB used / ${telemetry.memory.totalJSHeapSize} MB total (Limit: ${telemetry.memory.jsHeapSizeLimit} MB)`);
    }

    if (extraContext && Object.keys(extraContext).length > 0) {
      lines.push('------------------------------------------------------------------------');
      lines.push('DIAGRAM & WORKSPACE METRICS:');
      for (const [k, v] of Object.entries(extraContext)) {
        lines.push(`  - ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      }
    }

    lines.push('========================================================================');
    lines.push('CAPTURED RUNTIME LOG ENTRIES (CHRONOLOGICAL):');
    lines.push('------------------------------------------------------------------------');

    if (this.logs.length === 0) {
      lines.push('No runtime logs captured.');
    } else {
      for (const entry of this.logs) {
        const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase().padEnd(5)}]`;
        lines.push(`${prefix} ${entry.message}`);
        if (entry.stack) {
          lines.push(`    Stack Trace: ${entry.stack.split('\n').join('\n    ')}`);
        }
      }
    }

    lines.push('========================================================================');
    lines.push('END OF DEBUG LOG');
    lines.push('========================================================================');

    return lines.join('\n');
  }
}

export const debugLogger = new DebugLoggerService();
