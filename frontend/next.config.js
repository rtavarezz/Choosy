const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure local packages don't bundle their own React
  transpilePackages: ['@choosy/ui'],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Force a single React instance from frontend
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };
    return config;
  },
  async rewrites() {
    // Proxy API requests to FastAPI backend in dev
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
