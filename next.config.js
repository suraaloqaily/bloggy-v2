/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    // Ensure SWC is used for Next.js compilation
    styledComponents: true, // If you're using styled-components
  },
  experimental: {
    // Force Next.js to use SWC even when Babel config is present
    forceSwcTransforms: true,
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=9999999999, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    domains: [],
    minimumCacheTTL: 60,
  },
};

module.exports = nextConfig;
