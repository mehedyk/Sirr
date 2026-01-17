// Singleton Pattern: ThemeManager ensures single instance globally
import { Theme } from '@/domain/models/Theme';
import { ThemeName, ITheme } from '@/types';
import { ThemeObserver } from '@/observers/ThemeObserver';

export class ThemeManager {
  private static instance: ThemeManager | null = null;
  private currentTheme: Theme | null = null;
  private themes: Map<ThemeName, Theme> = new Map();
  private observers: ThemeObserver[] = [];

  private constructor() {
    this.initializeThemes();
    this.loadSavedTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public subscribe(observer: ThemeObserver): void {
    this.observers.push(observer);
  }

  public unsubscribe(observer: ThemeObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => {
      observer.onThemeChange(this.currentTheme!);
    });
  }

  private initializeThemes(): void {
    const themeConfigs: ITheme[] = [
      {
        name: 'neo-noir',
        displayName: 'Neo Noir',
        colors: {
          background: '#0a0a0a',
          backgroundSecondary: '#1a1a1a',
          primary: '#00ff88',
          secondary: '#00d4ff',
          accent: '#00ff88',
          text: '#ffffff',
          textSecondary: '#888888',
          border: '#333333',
        },
        fonts: {
          body: 'Fira Code, monospace',
          heading: 'Orbitron, sans-serif',
        },
      },
      {
        name: 'digital-matrix',
        displayName: 'Digital Matrix',
        colors: {
          background: '#000000',
          backgroundSecondary: '#001100',
          primary: '#00ff41',
          secondary: '#003300',
          accent: '#00ff41',
          text: '#00ff41',
          textSecondary: '#00cc33',
          border: '#003300',
        },
        fonts: {
          body: 'Source Code Pro, monospace',
          heading: 'Exo 2, sans-serif',
        },
      },
      {
        name: 'midnight-tech',
        displayName: 'Midnight Tech',
        colors: {
          background: '#0d1117',
          backgroundSecondary: '#161b22',
          primary: '#6e40c9',
          secondary: '#8b5cf6',
          accent: '#8b5cf6',
          text: '#c9d1d9',
          textSecondary: '#8b949e',
          border: '#30363d',
        },
        fonts: {
          body: 'Roboto Mono, monospace',
          heading: 'Barlow, sans-serif',
        },
      },
      {
        name: 'tech-rust',
        displayName: 'Tech Rust',
        colors: {
          background: '#1e1e1e',
          backgroundSecondary: '#2d1b0e',
          primary: '#ff6b35',
          secondary: '#f7931e',
          accent: '#ff6b35',
          text: '#ffffff',
          textSecondary: '#cccccc',
          border: '#3d2815',
        },
        fonts: {
          body: 'JetBrains Mono, monospace',
          heading: 'Rajdhani, sans-serif',
        },
      },
      {
        name: 'solar-shift',
        displayName: 'Solar Shift',
        colors: {
          background: '#0a0e27',
          backgroundSecondary: '#1a1f3a',
          primary: '#ffd700',
          secondary: '#ff4444',
          accent: '#ffaa00',
          text: '#ffffff',
          textSecondary: '#cccccc',
          border: '#2a2f4a',
        },
        fonts: {
          body: 'Space Mono, monospace',
          heading: 'Orbitron, sans-serif',
        },
      },
    ];

    themeConfigs.forEach(config => {
      this.themes.set(config.name, new Theme(config));
    });
  }

  public getTheme(name: ThemeName): Theme | null {
    return this.themes.get(name) || null;
  }

  public getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  public setTheme(name: ThemeName): void {
    const theme = this.themes.get(name);
    if (!theme) {
      throw new Error(`Theme ${name} not found`);
    }

    this.currentTheme = theme;
    theme.apply();
    this.saveTheme(name);
    this.notifyObservers();
  }

  public getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  private saveTheme(name: ThemeName): void {
    try {
      localStorage.setItem('sirr-theme', name);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  private loadSavedTheme(): void {
    try {
      const savedTheme = localStorage.getItem('sirr-theme') as ThemeName;
      if (savedTheme && this.themes.has(savedTheme)) {
        this.setTheme(savedTheme);
      } else {
        // Default to first theme
        this.setTheme('neo-noir');
      }
    } catch (error) {
      console.error('Failed to load saved theme:', error);
      this.setTheme('neo-noir');
    }
  }
}
