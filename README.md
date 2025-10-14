# EPG Service

Ein Next.js basierter EPG (Electronic Program Guide) Service, der täglich EPG-Daten von einer .xml.gz Quelle lädt und als XML API bereitstellt.

## Features

- ✅ **Multi-Source EPG**: Automatisches Laden von mehreren EPG Quellen
- ✅ **Format Support**: Unterstützung für .xml und .xml.gz Dateien
- ✅ **Smart Merging**: Intelligentes Mergen mit Deduplizierung
- ✅ **Auto-Update**: Tägliche automatische Aktualisierung
- ✅ **High Performance**: In-Memory Caching & CDN Optimierung
- ✅ **Modern UI**: Headless UI mit Framer Motion Animationen
- ✅ **Statistics**: Besucher- und Download-Counter
- ✅ **TypeScript**: Vollständige Typsicherheit
- ✅ **Production Ready**: Optimiert für Vercel Edge Network

## Technologie-Stack

- **Framework**: Next.js 15 (App Router)
- **Sprache**: TypeScript
- **Runtime**: Node.js
- **UI Components**: Headless UI + Heroicons
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS
- **Dekomprimierung**: pako
- **XML Processing**: fast-xml-parser

## EPG Quellen

Der Service lädt und merged automatisch folgende EPG Quellen:

1. **GlobeTV Germany EPG** (XML)
   - https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Germany/germany1.xml
   
2. **EPGShare DE1** (XML.GZ)
   - https://epgshare01.online/epgshare01/epg_ripper_DE1.xml.gz

Die Quellen werden parallel geladen und intelligent gemerged, wobei Duplikate automatisch entfernt werden.

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren (optional)

Erstellen Sie eine `.env` Datei für optionale Konfiguration:

```env
EPG_REVALIDATE_SECONDS=86400
```

- `EPG_REVALIDATE_SECONDS`: Cache-Dauer in Sekunden (Standard: 86400 = 24 Stunden)

Die EPG-Quellen sind direkt im Code konfiguriert (`lib/epg-service.ts`).

### 3. Development Server starten

```bash
npm run dev
```

Der Service ist dann unter `http://localhost:3000` verfügbar.

## API Endpoints

### GET /api/epg

Gibt die gemergten EPG Daten als XML zurück.

**Response:**
- Content-Type: `application/xml; charset=utf-8`
- Status: 200 (bei Erfolg) oder 500 (bei Fehler)

**Beispiel:**

```bash
curl http://localhost:3000/api/epg
```

### GET /api/epg/status

Gibt Informationen über den Cache-Status und die konfigurierten Quellen zurück.

**Response:**
- Content-Type: `application/json`
- Status: 200 (bei Erfolg) oder 500 (bei Fehler)

**Beispiel:**

```bash
curl http://localhost:3000/api/epg/status
```

**Response Beispiel:**

```json
{
  "cache": {
    "active": true,
    "age": 3600000,
    "ageFormatted": "1 Stunde",
    "revalidateSeconds": 86400
  },
  "sources": [
    {
      "name": "GlobeTV Germany EPG",
      "url": "https://...",
      "type": "xml"
    },
    {
      "name": "EPGShare DE1",
      "url": "https://...",
      "type": "xml.gz"
    }
  ],
  "endpoints": {
    "epg": "/api/epg",
    "status": "/api/epg/status",
    "refresh": "/api/epg/refresh"
  }
}
```

### POST /api/epg/refresh

Setzt den Cache manuell zurück. Die Daten werden beim nächsten Request neu geladen.

**Response:**
- Content-Type: `application/json`
- Status: 200 (bei Erfolg) oder 500 (bei Fehler)

**Beispiel:**

```bash
curl -X POST http://localhost:3000/api/epg/refresh
```

### GET /api/stats

Gibt die aktuellen Statistiken (Besucher und Downloads) zurück.

**Response:**
- Content-Type: `application/json`
- Status: 200 (bei Erfolg) oder 500 (bei Fehler)

**Beispiel:**

```bash
curl http://localhost:3000/api/stats
```

**Response Beispiel:**

```json
{
  "success": true,
  "stats": {
    "visitors": 42,
    "downloads": 123,
    "lastReset": 1697280000000
  }
}
```

## Deployment auf Vercel

### Automatisches Deployment

1. Repository mit GitHub verbinden
2. Auf Vercel importieren
3. Optional: Umgebungsvariable setzen:
   - `EPG_REVALIDATE_SECONDS` (Standard: 86400)

### Manuelles Deployment

```bash
npm install -g vercel
vercel
```

## Architektur

### Caching-Strategie

Der Service verwendet eine mehrstufige Caching-Strategie:

1. **In-Memory Cache**: Die gemergten EPG Daten werden im Speicher gecacht
2. **Zeitbasierte Revalidierung**: Cache wird nach konfigurierbarer Zeit automatisch aktualisiert
3. **CDN Cache**: Vercel CDN cached die Responses für 1 Stunde

### EPG Merge-Prozess

1. Alle Quellen werden parallel geladen (Performance-Optimierung)
2. Komprimierte Dateien (.xml.gz) werden automatisch dekomprimiert
3. XML-Daten werden geparst und normalisiert
4. Channels werden dedupliziert (basierend auf Channel-ID)
5. Programme werden gesammelt und nach Startzeit sortiert
6. Finales XML wird generiert und cached

### Dateistruktur

```
├── app/
│   ├── api/
│   │   ├── epg/
│   │   │   ├── route.ts       # EPG XML API
│   │   │   ├── status/
│   │   │   │   └── route.ts   # Status API
│   │   │   └── refresh/
│   │   │       └── route.ts   # Cache Refresh API
│   │   └── stats/
│   │       ├── route.ts       # Statistik API
│   │       └── visitor/
│   │           └── route.ts   # Besucher-Counter
│   ├── layout.tsx             # Root Layout
│   ├── page.tsx               # Homepage
│   └── globals.css            # Globale Styles
├── components/
│   ├── stats-card.tsx         # Statistik-Karten
│   ├── epg-status.tsx         # EPG Status Display
│   ├── api-endpoints.tsx      # API Endpoints Liste
│   └── support-banner.tsx     # Support Banner
├── lib/
│   ├── epg-service.ts         # EPG Service Logik
│   └── stats-service.ts       # Statistik Service
├── next.config.ts             # Next.js Konfiguration
├── tailwind.config.ts         # Tailwind Konfiguration
├── vercel.json                # Vercel Deployment Config
├── package.json
├── tsconfig.json
└── README.md
```

## Performance

- Automatisches Caching reduziert externe API Calls
- Vercel Edge Network für globale Verfügbarkeit
- Komprimierte Übertragung durch CDN
- Optimierte React Components mit Framer Motion
- Client-Side Caching für Statistiken

## Unterstützung

Gefällt dir dieses Projekt? Unterstütze die Entwicklung:

🎁 [Amazon Wunschzettel](https://www.amazon.de/hz/wishlist/ls/2K3UPHK4UWCXP?ref_=wl_share)

## Lizenz

MIT

