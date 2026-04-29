import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

export enum Theme {
  Dark = 'dark',
  Light = 'light',
  System = 'system',
}

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: Theme.System,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function ThemeProvider({
  children,
  defaultTheme = Theme.Light,
  storageKey = 'app-theme',
  ...props
}: ThemeProviderProps) {
  // const [theme, setTheme] = useState<Theme>(
  //   () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  // );
  const [theme, setTheme] = useState<Theme>(Theme.Light);
  const themeRef = useRef<Theme>(theme);

  const algorithm = {
    [Theme.Dark]: antdTheme.darkAlgorithm,
    [Theme.Light]: antdTheme.defaultAlgorithm,
    [Theme.System]: mediaQuery.matches ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  };

  function setThemeStyle(newTheme: Theme.Dark | Theme.Light) {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', newTheme);
  }

  function toggleTheme(newTheme: Theme) {
    if (newTheme === Theme.System) {
      const systemTheme = mediaQuery.matches ? Theme.Dark : Theme.Light;
      setThemeStyle(systemTheme);
    } else {
      setThemeStyle(newTheme);
    }
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
    themeRef.current = newTheme;
  }

  useEffect(() => {
    const currentTheme = themeRef.current;
    if (currentTheme === Theme.System) {
      setThemeStyle(mediaQuery.matches ? Theme.Dark : Theme.Light);
    } else {
      setThemeStyle(currentTheme);
    }
  }, [theme]);

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={{
        theme,
        setTheme: toggleTheme,
      }}
    >
      <ConfigProvider
        theme={{
          algorithm: algorithm[theme],
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeProviderContext.Provider>
  );
}
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

