export const languages = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
} as const;

export type Language = keyof typeof languages;

export const defaultLanguage: Language = 'de';

export const locales = Object.keys(languages) as Language[];
