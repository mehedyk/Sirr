// Decorator Pattern: LoggingDecorator adds logging capabilities to services
export class LoggingDecorator {
  private serviceName: string;
  private enabled: boolean = true;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.serviceName}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }

  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}
