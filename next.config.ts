import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/workspace", permanent: false },
      { source: "/reports", destination: "/archive", permanent: false },
    ];
  },
};

export default nextConfig;
