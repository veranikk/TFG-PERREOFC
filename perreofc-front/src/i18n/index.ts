/**
 * Internationalization setup or translations for the mobile app.
 * It provides localized strings so screens can switch language without hardcoded copy.
 */

import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';
import ca from './locales/ca.json';

export type Locale = 'es' | 'en' | 'ca';

const LOCALE_KEY = '@perreofc:locale';

export const i18n = new I18n({ es, en, ca });

i18n.locale = 'es';
i18n.defaultLocale = 'es';
i18n.enableFallback = true;

export async function loadLocale(): Promise<void> {
  const saved = await AsyncStorage.getItem(LOCALE_KEY);
  if (saved === 'es' || saved === 'en' || saved === 'ca') {
    i18n.locale = saved;
  }
}

export async function setLocale(locale: Locale): Promise<void> {
  i18n.locale = locale;
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}

/** Shorthand para traducir */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
