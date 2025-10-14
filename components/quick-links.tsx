'use client';

import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  PlayCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface QuickLink {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const links: QuickLink[] = [
  {
    name: 'Live TV',
    description: 'Deutsche Sender streamen',
    icon: PlayCircleIcon,
    href: '#tv-player',
    color: 'from-purple-500 to-pink-600',
  },
  {
    name: 'Setup-Anleitungen',
    description: 'EPG in deiner App einrichten',
    icon: BookOpenIcon,
    href: '#setup',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'Nützliche Tools',
    description: 'QR-Code, Downloads & mehr',
    icon: Cog6ToothIcon,
    href: '#tools',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Statistiken',
    description: 'Besucher & Downloads',
    icon: ChartBarIcon,
    href: '#stats',
    color: 'from-orange-500 to-red-600',
  },
];

export function QuickLinks() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Schnellzugriff</h2>
        <p className="text-slate-400">Direkt zu den wichtigsten Bereichen</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {links.map((link, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection(link.href)}
            className="group relative overflow-hidden bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-xl p-6 backdrop-blur-sm transition-all"
          >
            {/* Gradient Background on Hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity`}
            />

            {/* Content */}
            <div className="relative">
              <div className="mb-4">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${link.color}`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-white font-semibold mb-2 text-left">
                {link.name}
              </h3>
              <p className="text-slate-400 text-sm text-left">
                {link.description}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-slate-400 group-hover:text-white transition-colors">
                <span className="text-xs font-medium">Zum Bereich</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

