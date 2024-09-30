/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  eslint: {ignoreDuringBuilds: true},
  typescript: {ignoreBuildErrors: true},
  experimental: {
    serverActions: {
      allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'https://*.vercel.app'],
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [{hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com'}], // v0 generated images
  },
}

module.exports = baseConfig
