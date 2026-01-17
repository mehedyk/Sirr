import { ITheme, ThemeName } from '@/types';

export class Theme implements ITheme {
  public name: ThemeName;
  public displayName: string;
  public colors: {
    background: string;
    backgroundSecondary: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  public fonts: {
    body: string;
    heading: string;
  };

  constructor(data: ITheme) {
    this.name = data.name;
    this.displayName = data.displayName;
    this.colors = data.colors;
    this.fonts = data.fonts;
  }

  public apply(): void {
    const root = document.documentElement;
    
    // Apply colors as CSS variables
    Object.entries(this.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply fonts
    root.style.setProperty('--font-body', this.fonts.body);
    root.style.setProperty('--font-heading', this.fonts.heading);
    
    // Set theme class
    root.setAttribute('data-theme', this.name);
  }

  public toJSON(): ITheme {
    return {
      name: this.name,
      displayName: this.displayName,
      colors: this.colors,
      fonts: this.fonts,
    };
  }
}
