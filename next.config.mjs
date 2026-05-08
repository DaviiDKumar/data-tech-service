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
  // In Next.js 16, 'turbo' is now 'turbopack'
  turbopack: {
    // Your Turbopack settings here
  },
  // This is also a good time to ensure caching is enabled 
  // if you're using the new React 19 features
  cacheComponents: true, 
};

export default nextConfig;