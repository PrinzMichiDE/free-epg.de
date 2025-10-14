import { StatsCard } from '@/components/stats-card';
import { EpgStatus } from '@/components/epg-status';
import { ApiEndpoints } from '@/components/api-endpoints';
import { SupportBanner } from '@/components/support-banner';
import { EpgAutoUpdater } from '@/components/epg-auto-updater';
import { SignalIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Auto-Update Checker */}
      <EpgAutoUpdater />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-lg">
              <SignalIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600">
            EPG Service
          </h1>
          <p className="text-xl text-slate-300 mb-2 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-emerald-400" />
            Electronic Program Guide API
          </p>
          <p className="text-sm text-slate-400">
            Mehrere Quellen • Intelligent gemerged • Täglich aktualisiert
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsCard />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-8">
            <EpgStatus />
            
            {/* Features */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
              <div className="space-y-3">
                {[
                  'Mehrere EPG-Quellen (GlobeTV + EPGShare)',
                  'Intelligentes Mergen & Deduplizierung',
                  'Unterstützt .xml und .xml.gz',
                  'Tägliche automatische Aktualisierung',
                  'In-Memory Caching für Performance',
                  'Optimiert für Vercel Edge Network',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <ApiEndpoints />
          </div>
        </div>

        {/* Support Banner */}
        <SupportBanner />

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>
            Erstellt mit Next.js, TypeScript und Headless UI • Open Source
          </p>
        </footer>
      </div>
    </main>
  );
}
