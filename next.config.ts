import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/overview',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
