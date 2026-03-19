/**
 * LoggingDecorator — structured logging for Sirr services.
 * Production: only logs 'error' level to avoid leaking IDs/metadata.
 * Development: logs all levels to the browser console.
 */

const IS_DEV = import.meta.env.DEV;

type LogLevel = 'info' | 'warn' | 'error';

export class LoggingDecorator {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private shouldLog(level: LogLevel): boolean {
    if (IS_DEV) return true;
    // In production, only errors are surfaced — prevent metadata leakage (S10)
    return level === 'error';
  }

  log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;
    const prefix = `[Sirr/${this.serviceName}] ${level.toUpperCase()}`;
    // Never log data objects in production — they may contain user IDs / keys
    if (IS_DEV) {
      if (level === 'error') console.error(prefix, message, data ?? '');
      else if (level === 'warn') console.warn(prefix, message, data ?? '');
      else console.log(prefix, message, data ?? '');
    } else {
      // Production: sanitise — only the message string, no data
      console.error(prefix, message);
    }
  }

  info(message: string, data?: unknown): void  { this.log('info',  message, data); }
  warn(message: string, data?: unknown): void  { this.log('warn',  message, data); }
  error(message: string, data?: unknown): void { this.log('error', message, data); }
}
