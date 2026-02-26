import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/social',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
