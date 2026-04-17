/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'nodemailer'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  poweredByHeader: false,
};
module.exports = nextConfig;
