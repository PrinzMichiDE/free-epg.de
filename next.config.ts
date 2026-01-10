import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel optimiert
  experimental: {
    // Reduziert Bundle Size
    optimizePackageImports: ['pako'],
  },
  output: 'standalone',
};

export default nextConfig;

