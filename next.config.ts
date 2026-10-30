import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint is not installed (kept the install small); tsc still type-checks the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
