'use client';

import { useState, useEffect, useMemo } from 'react';
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
  startDate: string; // ISO string
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
  const [timeWindow, setTimeWindow] = useState(6); // Stunden

  useEffect(() => {
    let mounted = true;
    
    const loadPreview = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/epg/preview?country=${selectedCountry}&limit=20`, {
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
    }, 60000);
    
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

  // Berechne Zeit-Spalten (30-Minuten-Intervalle)
  const timeSlots = useMemo(() => {
    const now = new Date();
    const slots: Date[] = [];
    const startHour = now.getHours();
    const startMinute = Math.floor(now.getMinutes() / 30) * 30;
    
    const slotCount = timeWindow * 2; // 2 Slots pro Stunde
    
    for (let i = 0; i < slotCount; i++) {
      const slotTime = new Date(now);
      slotTime.setHours(startHour, startMinute + (i * 30), 0, 0);
      slots.push(slotTime);
    }
    
    return slots;
  }, [timeWindow]);

  const formatTimeSlot = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const getProgrammePosition = (programme: Programme, slots: Date[]) => {
    if (!slots || slots.length === 0) {
      return { left: 0, width: 10 };
    }
    
    const startDate = new Date(programme.startDate);
    const startTime = startDate.getTime();
    const slotWidth = 100 / slots.length;
    
    // Finde Start-Slot
    let startSlot = 0;
    for (let i = 0; i < slots.length - 1; i++) {
      const slotStart = slots[i]?.getTime();
      const slotEnd = slots[i + 1]?.getTime();
      if (slotStart && slotEnd && startTime >= slotStart && startTime < slotEnd) {
        startSlot = i;
        break;
      }
      if (slotStart && startTime < slotStart) break;
    }
    
    // Berechne Position innerhalb des Slots
    const slotStart = slots[startSlot]?.getTime() || startTime;
    const slotEnd = slots[startSlot + 1]?.getTime() || slotStart + (30 * 60 * 1000);
    const slotDuration = slotEnd - slotStart;
    const offsetInSlot = slotDuration > 0 ? Math.max(0, ((startTime - slotStart) / slotDuration) * slotWidth) : 0;
    
    // Berechne Breite basierend auf Dauer
    const durationMs = programme.duration * 60 * 1000;
    const width = slotDuration > 0 ? Math.max((durationMs / slotDuration) * slotWidth, slotWidth * 0.3) : slotWidth;
    
    const left = Math.max(0, startSlot * slotWidth + offsetInSlot);
    const maxWidth = 100 - left;
    
    return {
      left,
      width: Math.min(width, maxWidth),
    };
  };

  // Verarbeite Kanäle mit Programmen für das Grid
  const processedChannels = useMemo(() => {
    if (!data || !data.channels || timeSlots.length === 0) return [];
    
    const firstSlot = timeSlots[0]?.getTime() || Date.now();
    const lastSlot = timeSlots[timeSlots.length - 1]?.getTime() + (30 * 60 * 1000) || Date.now() + (timeWindow * 60 * 60 * 1000);
    
    return data.channels.map(channel => {
      const programmes = channel.programmes
        .map(p => {
          try {
            const startDateObj = new Date(p.startDate);
            if (isNaN(startDateObj.getTime())) {
              return null;
            }
            return {
              ...p,
              startDateObj,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is NonNullable<typeof p> => {
          if (!p) return false;
          const progTime = p.startDateObj.getTime();
          return progTime >= firstSlot && progTime <= lastSlot;
        })
        .sort((a, b) => a.startDateObj.getTime() - b.startDateObj.getTime());
      
      return {
        ...channel,
        programmes,
      };
    }).filter(ch => ch.programmes.length > 0);
  }, [data, timeSlots, timeWindow]);

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
            <h3 className="text-xl font-bold text-white mb-1">TV Programm</h3>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const loadPreview = async () => {
                  try {
                    const response = await fetch(`/api/epg/preview?country=${selectedCountry}&limit=20`, {
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-64">
            <label className="block text-sm font-semibold text-white mb-2">
              Land auswählen
            </label>
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-semibold text-white mb-2">
              Zeitraum
            </label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white font-medium hover:border-white/20 transition-all"
            >
              <option value={3}>3 Stunden</option>
              <option value={6}>6 Stunden</option>
              <option value={12}>12 Stunden</option>
              <option value={24}>24 Stunden</option>
            </select>
          </div>
        </div>
      </div>

      {/* TV Magazine Style Grid */}
      <div className="overflow-x-auto -mx-8 px-8">
        <div className="min-w-[1200px]">
          {/* Time Header Row - Sticky */}
          <div 
            className="grid gap-2 mb-4 sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md pb-3 border-b border-white/10"
            style={{ gridTemplateColumns: `220px repeat(${timeSlots.length}, minmax(80px, 1fr))` }}
          >
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider px-3 py-3 bg-slate-900/60 rounded-lg">
              Kanal
            </div>
            {timeSlots.map((slot, idx) => (
              <div
                key={idx}
                className="text-center text-xs font-bold text-white px-2 py-3 bg-gradient-to-b from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg"
              >
                {formatTimeSlot(slot)}
              </div>
            ))}
          </div>

          {/* Channels Grid */}
          <div className="space-y-1">
            {processedChannels.map((channel, channelIdx) => {
              const isExpanded = expandedChannels.has(channel.id);
              
              return (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: channelIdx * 0.02 }}
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `220px repeat(${timeSlots.length}, minmax(80px, 1fr))` }}
                >
                  {/* Channel Name Column */}
                  <button
                    onClick={() => toggleChannel(channel.id)}
                    className="flex items-center space-x-3 px-4 py-4 bg-gradient-to-r from-slate-900/80 to-slate-800/60 rounded-lg hover:from-slate-800/80 hover:to-slate-700/60 transition-all text-left group border border-white/5"
                  >
                    {channel.icon && (
                      <img
                        src={channel.icon}
                        alt={channel.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {channel.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {channel.programmes.length} Programme
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Programme Timeline */}
                  <div className="col-span-full relative h-20 bg-slate-900/40 rounded-lg overflow-hidden border border-white/5">
                    {channel.programmes.map((programme, progIdx) => {
                      const position = getProgrammePosition(programme, timeSlots);
                      return (
                        <motion.div
                          key={`${channel.id}-${programme.start}-${progIdx}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: progIdx * 0.03 }}
                          className="absolute top-1 bottom-1 rounded-md px-2 py-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/40 hover:from-purple-500/40 hover:to-pink-500/40 hover:border-purple-300/60 transition-all cursor-pointer group shadow-lg"
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            minWidth: '80px',
                            zIndex: progIdx,
                          }}
                          title={`${programme.title}\n${programme.startTime} • ${programme.duration} Min${programme.category ? ` • ${programme.category}` : ''}`}
                        >
                          <div className="text-xs font-bold text-white truncate mb-0.5 group-hover:text-purple-100">
                            {programme.title}
                          </div>
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-200">
                            <ClockIcon className="w-3 h-3" />
                            <span>{programme.startTime}</span>
                            {programme.category && (
                              <>
                                <span className="text-purple-300">•</span>
                                <span className="text-purple-300 truncate">{programme.category}</span>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && channel.programmes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="col-span-full mt-3 space-y-2"
                    >
                      {channel.programmes.map((programme, progIdx) => (
                        <motion.div
                          key={`detail-${channel.id}-${programme.start}-${progIdx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: progIdx * 0.05 }}
                          className="bg-gradient-to-r from-slate-900/80 to-slate-800/60 rounded-lg p-4 border border-white/5 hover:border-purple-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="flex items-center space-x-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                                  <ClockIcon className="w-4 h-4 text-purple-300" />
                                  <span className="text-sm font-bold text-purple-300">{programme.startTime}</span>
                                  <span className="text-xs text-purple-200">({programme.duration} Min)</span>
                                </div>
                                {programme.category && (
                                  <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold rounded-lg">
                                    {programme.category}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-white font-bold text-lg mb-2">{programme.title}</h4>
                              {programme.description && (
                                <p className="text-slate-300 text-sm leading-relaxed">
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
      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="text-xs text-slate-400 text-center">
          Zeigt {processedChannels.length} von {data.totalChannels} Kanälen • 
          Generiert: {new Date(data.generatedAt).toLocaleString('de-DE')}
        </p>
      </div>
    </motion.div>
  );
}
