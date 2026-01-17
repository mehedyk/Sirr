// Factory Pattern: ThemeFactory creates theme instances
import { Theme } from '@/domain/models/Theme';
import { ThemeName, ITheme } from '@/types';

export class ThemeFactory {
  public static createTheme(name: ThemeName): Theme {
    const config = ThemeFactory.getThemeConfig(name);
    return new Theme(config);
  }

  private static getThemeConfig(name: ThemeName): ITheme {
    const configs: Record<ThemeName, ITheme> = {
      'neo-noir': {
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
      'digital-matrix': {
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
      'midnight-tech': {
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
      'tech-rust': {
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
      'solar-shift': {
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
    };

    return configs[name];
  }
}
