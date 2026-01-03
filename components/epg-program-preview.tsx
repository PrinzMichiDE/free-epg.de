'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  FilmIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CountrySelector } from './country-selector';

interface Programme {
  title: string;
  description: string;
  category: string;
  start: string;
  startFormatted: string;
  startTime: string;
  startDate: string; // ISO string from API
  duration: number; // in minutes
}

interface Channel {
  id: string;
  name: string;
  icon: string | null;
  programmes: Programme[];
}

interface EpgPreviewData {
  success: boolean;
  country: string;
  totalChannels: number;
  totalProgrammes: number;
  previewChannels: number;
  channels: Channel[];
  generatedAt: string;
}

export function EpgProgramPreview() {
  const [data, setData] = useState<EpgPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<'now' | 'evening' | 'night'>('now');

  useEffect(() => {
    let mounted = true;
    
    const loadPreview = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/epg/preview?country=${selectedCountry}&limit=10`, {
          cache: 'no-store',
        });
        
        if (!mounted) return;
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!mounted) return;
        
        if (result.success) {
          setData(result);
        } else {
          setError(result.message || 'Fehler beim Laden der Daten');
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Fehler beim Laden der EPG-Preview:', error);
        setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPreview();
    const interval = setInterval(() => {
      if (mounted) {
        loadPreview();
      }
    }, 60000); // Refresh alle Minute
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedCountry]);

  const toggleChannel = (channelId: string) => {
    setExpandedChannels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  // Berechne Zeit-Spalten basierend auf aktueller Zeit
  const getTimeSlots = () => {
    const now = new Date();
    const slots: Date[] = [];
    
    // Starte bei der aktuellen Stunde
    const startHour = now.getHours();
    const startMinute = Math.floor(now.getMinutes() / 30) * 30; // Runde auf nächste halbe Stunde
    
    for (let i = 0; i < 12; i++) { // 12 Zeit-Slots (6 Stunden)
      const slotTime = new Date(now);
      slotTime.setHours(startHour, startMinute + (i * 30), 0, 0);
      slots.push(slotTime);
    }
    
    return slots;
  };

  const formatTimeSlot = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const getProgrammePosition = (programme: Programme, timeSlots: Date[]) => {
    const startDate = new Date(programme.startDate);
    const startTime = startDate.getTime();
    const slotWidth = 100 / timeSlots.length; // Prozent pro Slot
    
    // Finde den Start-Slot
    let startSlot = 0;
    for (let i = 0; i < timeSlots.length - 1; i++) {
      if (startTime >= timeSlots[i].getTime() && startTime < timeSlots[i + 1].getTime()) {
        startSlot = i;
        break;
      }
    }
    
    // Berechne Position innerhalb des Slots
    const slotStart = timeSlots[startSlot].getTime();
    const slotDuration = timeSlots[startSlot + 1]?.getTime() - slotStart || 30 * 60 * 1000;
    const offsetInSlot = ((startTime - slotStart) / slotDuration) * slotWidth;
    
    // Berechne Breite basierend auf Dauer
    const durationMs = programme.duration * 60 * 1000;
    const width = (durationMs / slotDuration) * slotWidth;
    
    return {
      left: startSlot * slotWidth + offsetInSlot,
      width: Math.max(width, 5), // Mindestbreite 5%
    };
  };

  if (loading && !data) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-white/10 rounded-lg w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
            <FilmIcon className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">EPG Programm-Vorschau</h3>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const loadPreview = async () => {
                  try {
                    const response = await fetch(`/api/epg/preview?country=${selectedCountry}&limit=10`, {
                      cache: 'no-store',
                    });
                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const result = await response.json();
                    if (result.success) {
                      setData(result);
                    } else {
                      setError(result.message || 'Fehler beim Laden der Daten');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
                  } finally {
                    setLoading(false);
                  }
                };
                loadPreview();
              }}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-white text-sm transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!data || !data.success) {
    return null;
  }

  const timeSlots = getTimeSlots();
  const visibleChannels = data.channels.slice(0, 15);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-white/20 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 shadow-lg">
            <FilmIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">TV Programm</h3>
            <p className="text-slate-400 text-sm mt-1">
              {data.totalChannels.toLocaleString('de-DE')} Kanäle • {data.totalProgrammes.toLocaleString('de-DE')} Programme
            </p>
          </div>
        </div>
        <div className="md:w-64">
          <label className="block text-sm font-semibold text-white mb-2">
            Land auswählen
          </label>
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </div>
      </div>

      {/* TV Magazine Style Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Time Header Row */}
          <div className="grid grid-cols-[200px_repeat(12,1fr)] gap-2 mb-4 sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm pb-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
              Kanal
            </div>
            {timeSlots.map((slot, idx) => (
              <div
                key={idx}
                className="text-center text-xs font-semibold text-slate-300 px-2 py-2 border-b border-white/10"
              >
                {formatTimeSlot(slot)}
              </div>
            ))}
          </div>

          {/* Channels Grid */}
          <div className="space-y-2">
            {visibleChannels.map((channel, channelIdx) => {
              const isExpanded = expandedChannels.has(channel.id);
              const channelProgrammes = channel.programmes
                .map(p => ({
                  ...p,
                  startDate: new Date(p.startDate),
                }))
                .filter(p => {
                  const progTime = p.startDate.getTime();
                  const firstSlot = timeSlots[0].getTime();
                  const lastSlot = timeSlots[timeSlots.length - 1].getTime() + (30 * 60 * 1000);
                  return progTime >= firstSlot && progTime <= lastSlot;
                })
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

              return (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: channelIdx * 0.03 }}
                  className="grid grid-cols-[200px_repeat(12,1fr)] gap-2 items-start"
                >
                  {/* Channel Name Column */}
                  <button
                    onClick={() => toggleChannel(channel.id)}
                    className="flex items-center space-x-2 px-3 py-3 bg-slate-900/60 rounded-lg hover:bg-slate-800/60 transition-colors text-left group"
                  >
                    {channel.icon && (
                      <img
                        src={channel.icon}
                        alt={channel.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                        {channel.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {channelProgrammes.length} Programme
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Programme Timeline */}
                  <div className="col-span-12 relative h-16 bg-slate-900/40 rounded-lg overflow-hidden">
                    {channelProgrammes.map((programme, progIdx) => {
                      const position = getProgrammePosition(programme, timeSlots);
                      return (
                        <motion.div
                          key={`${channel.id}-${programme.start}-${progIdx}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: progIdx * 0.05 }}
                          className="absolute top-1 bottom-1 rounded px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all cursor-pointer group"
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            minWidth: '60px',
                          }}
                          title={`${programme.title} - ${programme.startTime}`}
                        >
                          <div className="text-xs font-semibold text-white truncate mb-0.5">
                            {programme.title}
                          </div>
                          <div className="text-[10px] text-slate-300 truncate">
                            {programme.startTime}
                            {programme.category && (
                              <span className="ml-1 text-purple-300">• {programme.category}</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && channelProgrammes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="col-span-13 mt-2 space-y-2"
                    >
                      {channelProgrammes.map((programme, progIdx) => (
                        <motion.div
                          key={`detail-${channel.id}-${programme.start}-${progIdx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: progIdx * 0.05 }}
                          className="bg-slate-900/60 rounded-lg p-4 border border-white/5"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="flex items-center space-x-1 text-purple-300">
                                  <ClockIcon className="w-4 h-4" />
                                  <span className="text-sm font-semibold">{programme.startTime}</span>
                                </div>
                                {programme.category && (
                                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded">
                                    {programme.category}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-white font-bold text-base mb-1">{programme.title}</h4>
                              {programme.description && (
                                <p className="text-slate-300 text-sm leading-relaxed line-clamp-2">
                                  {programme.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-slate-400 text-center">
          Zeigt {data.previewChannels} von {data.totalChannels} Kanälen • 
          Generiert: {new Date(data.generatedAt).toLocaleString('de-DE')}
        </p>
      </div>
    </motion.div>
  );
}
