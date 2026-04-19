/** @type {import('next').NextConfig} */
const nextConfig = {
  // Moved out of experimental as required by Next.js 16+
  serverExternalPackages: ['mongoose', 'nodemailer'], 
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Removed the unsupported 'eslint' block that was causing warnings
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  
  poweredByHeader: false,
};

module.exports = nextConfig;
