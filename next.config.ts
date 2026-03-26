import type { NextConfig } from "next";

const allowedDevOrigins =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ["192.168.1.34"];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
