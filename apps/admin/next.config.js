/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ecommerce/ui', '@ecommerce/validators', '@ecommerce/config'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

};

module.exports = nextConfig;