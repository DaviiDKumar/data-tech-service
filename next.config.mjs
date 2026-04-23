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
  // Optional: If you face memory issues during build on 1GB RAM
  experimental: {
    turbo: {
      // Turbopack settings if needed
    },
  },
};

export default nextConfig;