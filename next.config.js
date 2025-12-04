/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Plesk deployment için
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
