// Observer Pattern: ThemeObserver notifies components of theme changes
import { Theme } from '@/domain/models/Theme';

export interface IThemeObserver {
  onThemeChange(theme: Theme): void;
}

export class ThemeObserver implements IThemeObserver {
  private callback: (theme: Theme) => void;

  constructor(callback: (theme: Theme) => void) {
    this.callback = callback;
  }

  public onThemeChange(theme: Theme): void {
    this.callback(theme);
  }
}
