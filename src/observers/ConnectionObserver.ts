// Observer Pattern: ConnectionObserver monitors WebSocket connection status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface IConnectionObserver {
  onConnectionChange(status: ConnectionStatus): void;
}

export class ConnectionObserver implements IConnectionObserver {
  private callbacks: {
    onConnectionChange?: (status: ConnectionStatus) => void;
  };

  constructor(callback?: (status: ConnectionStatus) => void) {
    this.callbacks = {
      onConnectionChange: callback,
    };
  }

  public onConnectionChange(status: ConnectionStatus): void {
    if (this.callbacks.onConnectionChange) {
      this.callbacks.onConnectionChange(status);
    }
  }
}
