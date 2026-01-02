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
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Weitere Funktionen</h2>
        <p className="text-slate-400 text-base">Entdecke was der Service noch zu bieten hat</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {links.map((link, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollToSection(link.href)}
            className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 shadow-xl transition-all duration-300"
          >
            {/* Gradient Background on Hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />

            {/* Content */}
            <div className="relative">
              <div className="mb-5">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${link.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-white font-bold mb-2 text-left text-lg">
                {link.name}
              </h3>
              <p className="text-slate-400 text-sm text-left leading-relaxed">
                {link.description}
              </p>

              {/* Arrow */}
              <div className="mt-5 flex items-center text-slate-400 group-hover:text-white transition-colors">
                <span className="text-xs font-semibold uppercase tracking-wider">Zum Bereich</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300"
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

