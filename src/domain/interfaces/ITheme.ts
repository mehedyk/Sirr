import { ThemeName } from '@/types';

export interface ITheme {
  name: ThemeName;
  displayName: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
}
