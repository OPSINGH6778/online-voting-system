/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose', 'nodemailer'],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  poweredByHeader: false,
};

module.exports = nextConfig;