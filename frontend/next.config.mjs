/** @type {import('next').NextConfig} */

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BASE_URL || "https://api.irraya.com";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Razorpay checkout
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      // Styles: self + inline (required for CSS-in-JS / Tailwind)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + backend uploads + data URIs
      `img-src 'self' data: blob: ${backendUrl} https://images.unsplash.com https://lh3.googleusercontent.com`,
      // API calls: self + backend
      `connect-src 'self' ${backendUrl} https://api.razorpay.com wss://checkout.razorpay.com`,
      // Razorpay iframe
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      // Google OAuth
      "form-action 'self' https://accounts.google.com",
    ].join("; "),
  },
];

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.irraya.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
