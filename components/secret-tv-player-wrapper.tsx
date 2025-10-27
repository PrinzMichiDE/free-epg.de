'use client';

import dynamic from 'next/dynamic';
import { TvIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const SecretTvPlayer = dynamic(
  () => import('@/components/secret-tv-player').then(mod => ({ default: mod.SecretTvPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <TvIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
            <LockClosedIcon className="w-6 h-6 text-emerald-300 absolute top-0 right-0" />
          </div>
          <p className="text-white text-lg">Lade...</p>
        </div>
      </div>
    ),
  }
);

interface SecretTvPlayerWrapperProps {
  playlistUrl: string;
  requiredPin?: string;
}

export function SecretTvPlayerWrapper({ playlistUrl, requiredPin }: SecretTvPlayerWrapperProps) {
  return <SecretTvPlayer playlistUrl={playlistUrl} requiredPin={requiredPin} />;
}

