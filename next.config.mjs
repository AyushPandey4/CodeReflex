/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add fallback for 'fs' module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
