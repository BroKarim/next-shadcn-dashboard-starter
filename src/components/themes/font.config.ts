import { Geist, Geist_Mono } from 'next/font/google';

import { cn } from '@/lib/utils';

/**
 * Only the two fonts the app actually uses are loaded. Themes that used to
 * reference extra families (Inter, Outfit, Merriweather, …) now fall back to
 * Geist, so the page never downloads a dozen unused font files.
 */
const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans'
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export const fontVariables = cn(fontSans.variable, fontMono.variable);
