/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'didactic-umbrella-x54jjv4v7r6h6qwq-8000.app.github.dev',
      },
    ],
    // Disable image optimization if you're having issues (not recommended for production)
    // unoptimized: true,
  },
};

module.exports = nextConfig;