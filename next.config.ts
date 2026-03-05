import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
