import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel optimiert
  experimental: {
    // Reduziert Bundle Size
    optimizePackageImports: ['pako'],
  },
};

export default nextConfig;

