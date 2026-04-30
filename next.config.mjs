/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack(config) {
    if (config.cache && typeof config.cache === 'object') {
      config.cache.compression = 'gzip'
    }
    return config
  },
}

export default nextConfig
