/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['datatechservice.in', 'www.datatechservice.in'],
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;