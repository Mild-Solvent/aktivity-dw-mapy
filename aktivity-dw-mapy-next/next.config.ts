import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/aktivity-dw-mapy' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/aktivity-dw-mapy' : '',
  typedRoutes: false,
  distDir: 'dist',
}

export default nextConfig
