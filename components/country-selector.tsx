'use client';

import { motion } from 'framer-motion';
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
}

interface CountrySelectorProps {
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
}

export function CountrySelector({ selectedCountry, onCountryChange }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Länder von der API laden
    const loadCountries = async () => {
      try {
        const response = await fetch('/api/epg/status?country=DE');
        const data = await response.json();
        setCountries(data.availableCountries || []);
      } catch (error) {
        console.error('Fehler beim Laden der Länder:', error);
        // Fallback: Standard-Länder
        setCountries([
          { code: 'DE', name: 'Deutschland' },
          { code: 'US', name: 'United States' },
          { code: 'GB', name: 'United Kingdom' },
          { code: 'FR', name: 'France' },
          { code: 'IT', name: 'Italy' },
          { code: 'ES', name: 'Spain' },
          { code: 'NL', name: 'Netherlands' },
          { code: 'PL', name: 'Poland' },
          { code: 'AT', name: 'Austria' },
          { code: 'CH', name: 'Switzerland' },
          { code: 'BE', name: 'Belgium' },
          { code: 'CA', name: 'Canada' },
          { code: 'AU', name: 'Australia' },
        ]);
      }
    };

    loadCountries();
  }, []);

  const selectedCountryName = countries.find(c => c.code === selectedCountry)?.name || selectedCountry;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between hover:border-white/20 transition-all duration-300"
      >
        <div className="flex items-center space-x-3">
          <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-semibold">{selectedCountryName}</span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

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
            className="absolute z-50 w-full mt-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto"
          >
            <div className="p-2">
              {countries.map((country) => (
                <motion.button
                  key={country.code}
                  onClick={() => {
                    onCountryChange(country.code);
                    setIsOpen(false);
                  }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${
                    selectedCountry === country.code
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-white font-medium">{country.name}</span>
                  {selectedCountry === country.code && (
                    <CheckIcon className="w-5 h-5 text-emerald-400" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
