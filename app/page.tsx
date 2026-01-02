'use client';

import { motion } from 'framer-motion';
import { StatsCard } from '@/components/stats-card';
import { SupportBanner } from '@/components/support-banner';
import { EpgAutoUpdater } from '@/components/epg-auto-updater';
import { IptvLinkCard } from '@/components/iptv-link-card';
import { FeaturesGrid } from '@/components/features-grid';
import { TvPlayer } from '@/components/tv-player';
import { TvPlayerEnhanced } from '@/components/tv-player-enhanced';
import { TvPlayerUltra } from '@/components/tv-player-ultra';
import { UsefulFeatures } from '@/components/useful-features';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { QuickLinks } from '@/components/quick-links';
import { PwaTvPlayer } from '@/components/pwa-tv-player';
import { PwaTvPlayerEnhanced } from '@/components/pwa-tv-player-enhanced';
import { usePWAMode } from '@/components/pwa-detector';
import { EpgPreviewCard } from '@/components/epg-preview';
import { FaqSection } from '@/components/faq-section';
import { PerformanceMetrics } from '@/components/performance-metrics';
import { AdSenseBanner } from '@/components/adsense-banner';
import { KoFiSupport } from '@/components/kofi-support';
import { KoFiFloatingButton } from '@/components/kofi-floating-button';
import { SignalIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Ko-Fi Coffee Icon SVG Component
const CoffeeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 21h18v-2H2v2zM20 8h-2V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3H2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM6 5h10v3H6V5zm14 9H4v-2h16v2z"/>
  </svg>
);

export default function HomePage() {
  const isPWA = usePWAMode();

  // Wenn PWA-Modus: Nur Enhanced TV Player (ohne EPG Service)
  if (isPWA) {
    return <PwaTvPlayerEnhanced />;
  }

  // Normale Website: Volle Homepage
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Auto-Update Checker */}
      <EpgAutoUpdater />
      
      {/* PWA Install Prompt */}
      <PwaInstallPrompt />
      
      {/* Ko-Fi Floating Button */}
      <KoFiFloatingButton />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center mb-6"
          >
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl">
              <SignalIcon className="w-14 h-14 text-white" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 tracking-tight"
          >
            Kostenloser TV-Programm-Guide
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl md:text-2xl text-slate-300 mb-4 flex items-center justify-center font-medium"
          >
            <SparklesIcon className="w-6 h-6 mr-2.5 text-emerald-400" />
            Für deine IPTV-App
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Wähle dein Land aus, kopiere die URL und füge sie in deine IPTV-App ein. Sofort verfügbar für über 13 Länder weltweit.
          </motion.p>
        </div>

        {/* Main CTA - IPTV Link Card - Most Prominent */}
        <div className="mb-16">
          <IptvLinkCard />
        </div>

        {/* Key Benefits - Simplified */}
        <div className="mb-16">
          <FeaturesGrid />
        </div>

        {/* Live TV Player */}
        <div className="mb-16">
          <TvPlayerUltra />
        </div>

        {/* Stats - Simple */}
        <div id="stats" className="mb-16">
          <StatsCard />
        </div>

        {/* Support Section */}
        <div className="mb-16">
          <KoFiSupport variant="hero" />
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <FaqSection />
        </div>

        {/* AdSense Banner - Bottom */}
        <div className="mb-8">
          <AdSenseBanner 
            adSlot="1234567893"
            adFormat="auto"
            className="max-w-4xl mx-auto"
          />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm font-medium text-center md:text-left">
              Kostenloser Service • Keine Registrierung erforderlich • Open Source
            </p>
            <motion.a
              href="https://ko-fi.com/michelfritzsch"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B68] text-white font-semibold rounded-lg hover:from-[#FF6B68] hover:to-[#FF7875] transition-all shadow-lg shadow-[#FF5E5B]/50 text-sm"
            >
              <CoffeeIcon className="w-4 h-4 mr-2" />
              Projekt unterstützen
            </motion.a>
          </div>
        </footer>
      </div>
    </main>
  );
}
