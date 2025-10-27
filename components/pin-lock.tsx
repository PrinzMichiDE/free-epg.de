'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon, LockOpenIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PinLockProps {
  onUnlock: () => void;
  requiredPin: string;
}

export function PinLock({ onUnlock, requiredPin }: PinLockProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Fokussiere das erste Eingabefeld beim Laden
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Nur Zahlen erlauben
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Auto-Focus auf nächstes Feld
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Automatische Validierung wenn alle 4 Ziffern eingegeben
    if (index === 3 && value) {
      const enteredPin = [...newPin.slice(0, 3), value].join('');
      validatePin(enteredPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Springe zum vorherigen Feld bei Backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      validatePin(pin.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{4}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setPin(newPin);
      inputRefs.current[3]?.focus();
      validatePin(pastedData);
    }
  };

  const validatePin = (enteredPin: string) => {
    if (enteredPin === requiredPin) {
      // PIN korrekt
      onUnlock();
    } else {
      // PIN falsch
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      
      // Reset nach kurzer Verzögerung
      setTimeout(() => {
        setPin(['', '', '', '']);
        setError(false);
        inputRefs.current[0]?.focus();
      }, 1000);
    }
  };

  const handleClear = () => {
    setPin(['', '', '', '']);
    setError(false);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: shaking ? [1, 1.02, 0.98, 1.02, 0.98, 1] : 1 
        }}
        transition={{ duration: shaking ? 0.5 : 0.3 }}
        className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full transition-colors ${
            error 
              ? 'bg-red-500/20' 
              : 'bg-emerald-500/20'
          }`}>
            {error ? (
              <LockClosedIcon className="w-12 h-12 text-red-400" />
            ) : (
              <LockOpenIcon className="w-12 h-12 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          PIN eingeben
        </h2>
        <p className="text-slate-400 text-center mb-8">
          Gib deinen 4-stelligen PIN-Code ein
        </p>

        {/* PIN Input */}
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`w-16 h-16 text-center text-2xl font-bold rounded-xl transition-all ${
                error
                  ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                  : digit
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                  : 'bg-slate-700/50 border-2 border-slate-600 text-white'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <p className="text-red-400 text-sm font-medium">
              Falscher PIN-Code
            </p>
          </motion.div>
        )}

        {/* Clear Button */}
        <button
          onClick={handleClear}
          className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <XMarkIcon className="w-5 h-5" />
          Löschen
        </button>

        {/* Info Text */}
        <p className="text-slate-500 text-xs text-center mt-6">
          Der PIN-Code schützt den Zugriff auf diesen Bereich
        </p>
      </motion.div>
    </div>
  );
}

