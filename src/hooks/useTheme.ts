import { useEffect, useState } from 'react';
import { ThemeManager } from '@/services/ThemeManager';
import { Theme } from '@/domain/models/Theme';
import { ThemeObserver } from '@/observers/ThemeObserver';

export function useTheme() {
  const themeManager = ThemeManager.getInstance();
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(themeManager.getCurrentTheme());

  useEffect(() => {
    const observer = new ThemeObserver((theme) => {
      setCurrentTheme(theme);
    });

    themeManager.subscribe(observer);

    return () => {
      themeManager.unsubscribe(observer);
    };
  }, []);

  const setTheme = (themeName: Parameters<typeof themeManager.setTheme>[0]) => {
    themeManager.setTheme(themeName);
  };

  const getAllThemes = () => {
    return themeManager.getAllThemes();
  };

  return {
    currentTheme,
    setTheme,
    getAllThemes,
  };
}
