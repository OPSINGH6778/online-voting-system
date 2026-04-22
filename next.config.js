/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages that need to be handled by serverless functions
  serverExternalPackages: ['mongoose', 'bcryptjs', 'nodemailer', 'jsonwebtoken'],

  // TypeScript configuration
  typescript: {
    // Set to false for production to catch errors
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    unoptimized: false,
  },

  // Security headers
  poweredByHeader: false,

  // Environment variables that must be available at build time
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  },

  // Compression (enabled by default in Next.js 16)
  compress: true,
};

module.exports = nextConfig;