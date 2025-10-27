'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'Ist der EPG Service wirklich kostenlos?',
    answer: 'Ja, der Service ist komplett kostenlos und ohne Registrierung nutzbar. Es gibt keine versteckten Kosten oder Limits.',
  },
  {
    question: 'Wie oft werden die EPG-Daten aktualisiert?',
    answer: 'Die EPG-Daten werden täglich automatisch aktualisiert. Du kannst die Aktualisierung auch manuell über den Refresh-Button triggern.',
  },
  {
    question: 'Welche IPTV-Apps werden unterstützt?',
    answer: 'Alle gängigen IPTV-Apps die XMLTV unterstützen: TiviMate, IPTV Smarters Pro, Perfect Player, Kodi (PVR IPTV Simple Client), VLC und viele mehr.',
  },
  {
    question: 'Kann ich die EPG-Daten offline nutzen?',
    answer: 'Ja, du kannst die XML-Datei herunterladen und lokal in deiner IPTV-App verwenden. Die PWA unterstützt auch Offline-Funktionen.',
  },
  {
    question: 'Wie füge ich die EPG-URL in meiner App hinzu?',
    answer: 'Kopiere die EPG-URL von der Homepage und füge sie in den EPG-Einstellungen deiner IPTV-App ein. Detaillierte Anleitungen findest du im Setup-Bereich.',
  },
  {
    question: 'Warum zeigt meine App keine EPG-Daten an?',
    answer: 'Stelle sicher, dass die EPG-URL korrekt eingefügt wurde und die tvg-id in deiner M3U-Playlist mit den Channel-IDs im EPG übereinstimmen. Ein EPG-Update in der App kann auch helfen.',
  },
  {
    question: 'Kann ich eigene Sender hinzufügen?',
    answer: 'Der EPG Service lädt Daten von öffentlichen Quellen. Du kannst aber die M3U-Generator-Funktion nutzen um deine eigenen Sender mit der EPG-URL zu kombinieren.',
  },
  {
    question: 'Gibt es eine API für Entwickler?',
    answer: 'Ja! Die EPG-Daten sind über /api/epg als XML verfügbar. Zusätzlich gibt es /api/epg/status für Metadaten und /api/stats für Statistiken.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center space-x-3 mb-3">
          <QuestionMarkCircleIcon className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">Häufige Fragen</h2>
        </div>
        <p className="text-slate-400">
          Antworten auf die wichtigsten Fragen zum EPG Service
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <span className="text-white font-medium pr-4">{faq.question}</span>
              <ChevronDownIcon
                className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                  openIndex === index ? 'transform rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-slate-300 text-sm leading-relaxed border-t border-slate-700/50 pt-4">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

