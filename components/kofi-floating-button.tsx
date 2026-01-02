'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CoffeeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export function KoFiFloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Show button after user scrolls down a bit
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const koFiUrl = 'https://ko-fi.com/michelfritzsch';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50"
        >
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl mb-3 min-w-[280px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CoffeeIcon className="w-5 h-5 text-[#FF5E5B]" />
                  <span className="text-white font-semibold text-sm">Projekt unterstützen</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-slate-300 text-xs mb-3">
                Unterstütze die Entwicklung mit einem Kaffee auf Ko-Fi
              </p>
              <motion.a
                href={koFiUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full py-2.5 px-4 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B68] text-white font-semibold rounded-lg hover:from-[#FF6B68] hover:to-[#FF7875] transition-all shadow-lg shadow-[#FF5E5B]/50 text-center text-sm"
              >
                Auf Ko-Fi unterstützen
              </motion.a>
            </motion.div>
          ) : null}

          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B68] text-white rounded-full shadow-2xl shadow-[#FF5E5B]/50 flex items-center justify-center hover:from-[#FF6B68] hover:to-[#FF7875] transition-all border-2 border-white/20"
          >
            <CoffeeIcon className="w-6 h-6" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
