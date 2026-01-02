'use client';

import { motion } from 'framer-motion';
import { HeartIcon, CoffeeIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface KoFiSupportProps {
  variant?: 'hero' | 'card' | 'compact';
  className?: string;
}

export function KoFiSupport({ variant = 'hero', className = '' }: KoFiSupportProps) {
  const koFiUrl = 'https://ko-fi.com/michelfritzsch';

  if (variant === 'compact') {
    return (
      <motion.a
        href={koFiUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B68] text-white font-semibold rounded-lg hover:from-[#FF6B68] hover:to-[#FF7875] transition-all shadow-lg shadow-[#FF5E5B]/50 ${className}`}
      >
        <CoffeeIcon className="w-4 h-4 mr-2" />
        <span className="text-sm">Ko-Fi</span>
      </motion.a>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-[#FF5E5B]/30 transition-all duration-300 ${className}`}
      >
        <div className="flex items-start space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-[#FF5E5B]/20 to-[#FF6B68]/20 border border-[#FF5E5B]/30 rounded-xl">
            <CoffeeIcon className="w-6 h-6 text-[#FF5E5B]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">Projekt unterstützen</h3>
            <p className="text-sm text-slate-400">Mit einem Kaffee die Entwicklung fördern</p>
          </div>
        </div>
        <motion.a
          href={koFiUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="block w-full py-3 px-4 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B68] text-white font-semibold rounded-xl hover:from-[#FF6B68] hover:to-[#FF7875] transition-all shadow-lg shadow-[#FF5E5B]/50 text-center"
        >
          <span className="flex items-center justify-center">
            <CoffeeIcon className="w-5 h-5 mr-2" />
            Auf Ko-Fi unterstützen
          </span>
        </motion.a>
      </motion.div>
    );
  }

  // Hero variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5E5B]/10 via-[#FF6B68]/10 to-[#FF7875]/10 rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse"></div>
      </div>

      {/* Main Content */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl hover:border-[#FF5E5B]/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Icon Section */}
          <div className="flex-shrink-0">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="p-5 bg-gradient-to-br from-[#FF5E5B]/20 to-[#FF6B68]/20 border border-[#FF5E5B]/30 rounded-2xl shadow-lg"
            >
              <CoffeeIcon className="w-12 h-12 text-[#FF5E5B]" />
            </motion.div>
          </div>

          {/* Content Section */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-3">
              <SparklesIcon className="w-6 h-6 text-[#FF5E5B] mr-2" />
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Unterstütze das Projekt
              </h2>
            </div>
            <p className="text-slate-300 text-base md:text-lg mb-2 leading-relaxed">
              Gefällt dir dieser kostenlose EPG Service? Unterstütze die kontinuierliche Entwicklung 
              und Verbesserung mit einer Spende über Ko-Fi.
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Monatlich oder einmalig • Jeder Beitrag hilft, den Service am Laufen zu halten
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <motion.a
                href={koFiUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B68] text-white font-bold rounded-xl hover:from-[#FF6B68] hover:to-[#FF7875] transition-all shadow-xl shadow-[#FF5E5B]/50 text-lg"
              >
                <CoffeeIcon className="w-6 h-6 mr-2" />
                Auf Ko-Fi unterstützen
                <ArrowRightIcon className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </motion.a>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center px-6 py-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
              >
                <HeartIcon className="w-5 h-5 text-[#FF5E5B] mr-2 animate-pulse" />
                <span className="text-slate-300 font-medium text-sm">
                  Monatlich oder einmalig
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF5E5B]/10 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-[#FF5E5B]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Kontinuierliche Entwicklung</p>
              <p className="text-slate-400 text-xs">Neue Features & Verbesserungen</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF5E5B]/10 rounded-lg">
              <CoffeeIcon className="w-5 h-5 text-[#FF5E5B]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Flexible Unterstützung</p>
              <p className="text-slate-400 text-xs">Monatlich oder einmalig möglich</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF5E5B]/10 rounded-lg">
              <HeartIcon className="w-5 h-5 text-[#FF5E5B]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">100% Freiwillig</p>
              <p className="text-slate-400 text-xs">Service bleibt kostenlos</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
