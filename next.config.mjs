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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Required for SharedArrayBuffer (used by pdfjs worker)
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            // FIX 3: COOP must accompany COEP to enable the cross-origin
            // isolated context that unlocks Clipboard API (copy-paste).
            // Without this header, navigator.clipboard.writeText() is blocked
            // even though COEP is set.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
