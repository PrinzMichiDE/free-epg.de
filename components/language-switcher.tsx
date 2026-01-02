'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import { locales, languages, Language } from '@/lib/i18n';
import { useState } from 'react';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Extrahiere aktuelles Locale aus dem Pfad
  const currentLocale = (pathname.split('/')[1] as Language) || 'de';
  
  const switchLanguage = (locale: Language) => {
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    router.push(`/${locale}${pathWithoutLocale}`);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 flex items-center space-x-2 hover:border-white/30 transition-all"
        >
          <GlobeAltIcon className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">{currentLocale.toUpperCase()}</span>
        </motion.button>
        
        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-2 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-[120px]"
              >
                {locales.map((locale) => (
                  <motion.button
                    key={locale}
                    onClick={() => switchLanguage(locale)}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    className={`w-full px-4 py-2 text-left flex items-center justify-between ${
                      currentLocale === locale ? 'bg-emerald-500/20' : ''
                    }`}
                  >
                    <span className="text-white text-sm font-medium">{languages[locale]}</span>
                    {currentLocale === locale && (
                      <CheckIcon className="w-4 h-4 text-emerald-400" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
