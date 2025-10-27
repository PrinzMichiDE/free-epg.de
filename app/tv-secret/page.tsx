import { SecretTvPlayer } from '@/components/secret-tv-player';

export default function TvSecretPage() {
  // Lese Environment-Variable serverseitig
  const secretM3uUrl = process.env.SECRETM3U;

  // Fallback wenn die Variable nicht gesetzt ist
  if (!secretM3uUrl) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Konfigurationsfehler
            </h1>
            <p className="text-slate-300">
              Die Environment-Variable <code className="bg-slate-800 px-2 py-1 rounded">SECRETM3U</code> ist nicht gesetzt.
            </p>
            <p className="text-slate-400 text-sm mt-4">
              Bitte konfiguriere die Variable in deiner .env.local Datei.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <SecretTvPlayer playlistUrl={secretM3uUrl} />;
}

