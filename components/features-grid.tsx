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
    icon: GlobeAltIcon,
    title: 'Weltweite Abdeckung',
    description: 'EPG-Daten für über 13 Länder: Deutschland, USA, UK, Frankreich, Italien, Spanien und mehr',
    color: 'text-blue-400',
    gradient: 'from-blue-500/10 to-blue-600/5',
  },
  {
    icon: ArrowPathIcon,
    title: 'Täglich aktualisiert',
    description: 'Automatische Aktualisierung - immer die neuesten Programmdaten',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
  },
  {
    icon: BoltIcon,
    title: 'Sofort einsatzbereit',
    description: 'Einfach Land auswählen, URL kopieren und in deiner IPTV-App einfügen - fertig',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/10 to-yellow-600/5',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Zuverlässig & kostenlos',
    description: '100% kostenlos, ohne Registrierung und immer verfügbar',
    color: 'text-purple-400',
    gradient: 'from-purple-500/10 to-purple-600/5',
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
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
          Warum diesen Service nutzen?
        </h2>
        <p className="text-slate-400 text-lg md:text-xl">
          Einfach, schnell und zuverlässig
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
      >
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ 
              y: -4,
              transition: { type: 'spring', stiffness: 300, damping: 20 }
            }}
            className="group"
          >
            <div className={`h-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 shadow-xl transition-all duration-300 ${feature.gradient}`}>
              {/* Icon */}
              <div className="mb-5">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} border border-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-white font-bold text-lg mb-2.5">
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

