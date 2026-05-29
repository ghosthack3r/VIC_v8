import { createContext, useContext, type PropsWithChildren } from 'react';
import { getPalette, HUD_BASE, type HudPalette } from './palettes';
import type { PaletteId } from './types';

interface HudTheme {
  palette: HudPalette;
  base: typeof HUD_BASE;
}

const HudThemeContext = createContext<HudTheme>({
  palette: getPalette('cyan'),
  base: HUD_BASE,
});

interface HudThemeProviderProps extends PropsWithChildren {
  paletteId: PaletteId;
}

export function HudThemeProvider({ paletteId, children }: HudThemeProviderProps) {
  return (
    <HudThemeContext.Provider value={{ palette: getPalette(paletteId), base: HUD_BASE }}>
      {children}
    </HudThemeContext.Provider>
  );
}

export function useHudTheme() {
  return useContext(HudThemeContext);
}
