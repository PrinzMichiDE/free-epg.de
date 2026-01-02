'use client';

import { useParams } from 'next/navigation';
import { getTranslation, TranslationKey } from '@/lib/translations';
import { defaultLanguage, Language } from '@/lib/i18n';

export function useTranslations() {
  const params = useParams();
  const locale = (params?.locale as Language) || defaultLanguage;

  return {
    t: (key: TranslationKey) => getTranslation(locale, key),
    locale,
  };
}
