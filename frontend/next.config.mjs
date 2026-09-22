/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.irraya.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
