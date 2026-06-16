import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Poppins_700Bold } from '@expo-google-fonts/poppins';

// Passed to useFonts() in the root layout to load the bundled fonts.
export const APP_FONTS = {
  PlayfairDisplay_700Bold,
  Pacifico_400Regular,
  Fredoka_600SemiBold,
  Poppins_700Bold,
};

export type FontKey = 'default' | 'poppins' | 'playfair' | 'fredoka' | 'pacifico';

export interface FontOption {
  key: FontKey;
  label: string;
  family?: string; // undefined = system default
}

// Order shown in the picker. 'default' first.
export const FONT_OPTIONS: FontOption[] = [
  { key: 'default',  label: 'Predeterminada', family: undefined },
  { key: 'poppins',  label: 'Moderna',        family: 'Poppins_700Bold' },
  { key: 'playfair', label: 'Serif elegante', family: 'PlayfairDisplay_700Bold' },
  { key: 'fredoka',  label: 'Redondeada',     family: 'Fredoka_600SemiBold' },
  { key: 'pacifico', label: 'Manuscrita',     family: 'Pacifico_400Regular' },
];

/** fontFamily to apply for a stored font key (undefined => system default). */
export function fontFamilyFor(key?: string): string | undefined {
  return FONT_OPTIONS.find(o => o.key === key)?.family;
}
