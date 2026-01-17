import { useTheme } from '@/hooks/useTheme';
import { ThemeName } from '@/types';

export function ThemeSwitcher() {
  const { currentTheme, setTheme, getAllThemes } = useTheme();
  const themes = getAllThemes();

  return (
    <div className="relative">
      <select
        value={currentTheme?.name || 'neo-noir'}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
        className="px-4 py-2 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] appearance-none cursor-pointer"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {themes.map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
