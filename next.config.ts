import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/investigations", permanent: false },
      { source: "/workspace", destination: "/investigations", permanent: false },
      { source: "/reports", destination: "/archive", permanent: false },
    ];
  },
};

export default nextConfig;
