'use client';

import { useCallback, useEffect, useState } from 'react';

import { PALETTES, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/styles/colors';

export function ThemeSwitcher(): React.ReactElement {
  const [activeTheme, setActiveTheme] = useState<number>(DEFAULT_THEME);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const initial = stored ? Number(stored) : DEFAULT_THEME;
    setActiveTheme(initial);
    document.documentElement.setAttribute('data-theme', String(initial));
  }, []);

  const switchTheme = useCallback((id: number): void => {
    setActiveTheme(id);
    document.documentElement.setAttribute('data-theme', String(id));
    localStorage.setItem(THEME_STORAGE_KEY, String(id));
  }, []);

  const currentPalette = PALETTES.find((p) => p.id === activeTheme);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-lg transition-all duration-200 active:scale-[0.97]"
      >
        <span className="flex gap-1">
          {currentPalette?.colors.map((c) => (
            <span
              key={c.name}
              className="block h-3 w-3 rounded-full"
              style={{ background: c.hex }}
            />
          ))}
        </span>
        <span className="hidden sm:inline">{currentPalette?.name}</span>
      </button>

      {/* Palette picker */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-border/50 bg-card p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Switch palette
          </p>
          <div className="flex flex-col gap-1.5">
            {PALETTES.map((palette) => (
              <button
                key={palette.id}
                type="button"
                onClick={() => {
                  switchTheme(palette.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 active:scale-[0.98] ${
                  palette.id === activeTheme
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="flex gap-1">
                  {palette.colors.map((c) => (
                    <span
                      key={c.name}
                      className="block h-3.5 w-3.5 rounded-full"
                      style={{ background: c.hex }}
                    />
                  ))}
                </span>
                <span className="font-medium">{palette.name}</span>
                {palette.id === activeTheme && (
                  <span className="ml-auto text-xs text-primary">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
