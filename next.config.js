/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_SERVER_API_URL: process.env.NEXT_PUBLIC_SERVER_API_URL,
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

export default nextConfig;
