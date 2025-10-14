'use client';

import { motion } from 'framer-motion';
import {
  ServerStackIcon,
  BoltIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: ServerStackIcon,
    title: 'Multi-Source EPG',
    description: 'Kombiniert automatisch mehrere EPG-Quellen für maximale Abdeckung',
    color: 'text-blue-400',
    gradient: 'from-blue-500/10 to-blue-600/5',
  },
  {
    icon: BoltIcon,
    title: 'Blitzschnell',
    description: 'In-Memory Caching und CDN-Optimierung für sofortige Antworten',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/10 to-yellow-600/5',
  },
  {
    icon: ArrowPathIcon,
    title: 'Auto-Update',
    description: 'Täglich automatisch aktualisiert - immer die neuesten Programmdaten',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Zuverlässig',
    description: 'Intelligentes Merging mit Deduplizierung und Fehlerbehandlung',
    color: 'text-purple-400',
    gradient: 'from-purple-500/10 to-purple-600/5',
  },
  {
    icon: GlobeAltIcon,
    title: 'Deutschland-Fokus',
    description: 'Spezialisiert auf deutsche TV-Sender (GlobeTV + EPGShare)',
    color: 'text-red-400',
    gradient: 'from-red-500/10 to-red-600/5',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Vercel Edge',
    description: 'Global verfügbar über Vercel Edge Network',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/10 to-cyan-600/5',
  },
  {
    icon: ClockIcon,
    title: '24/7 Verfügbar',
    description: 'Immer online, keine Wartungszeiten oder Ausfälle',
    color: 'text-pink-400',
    gradient: 'from-pink-500/10 to-pink-600/5',
  },
  {
    icon: DocumentTextIcon,
    title: 'XML & GZ Support',
    description: 'Unterstützt sowohl .xml als auch .xml.gz Formate',
    color: 'text-orange-400',
    gradient: 'from-orange-500/10 to-orange-600/5',
  },
];

export function FeaturesGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-3">
          Leistungsstarker EPG Service
        </h2>
        <p className="text-slate-400 text-lg">
          Alles was du für deine IPTV-Anwendung brauchst
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05,
              transition: { type: 'spring', stiffness: 300 }
            }}
            className="group"
          >
            <div className={`h-full bg-gradient-to-br ${feature.gradient} border border-slate-700 hover:border-slate-600 rounded-xl p-6 backdrop-blur-sm transition-all duration-300`}>
              {/* Icon */}
              <div className="mb-4">
                <div className={`inline-flex p-3 rounded-lg bg-slate-800/80 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-white font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

