import type { NextConfig } from "next";

// Hide only the floating development badge, which otherwise covers the Home avatar.
// Runtime error overlays and all technical validations remain enabled.
const nextConfig: NextConfig = { devIndicators: false, experimental: { serverActions: { bodySizeLimit: "5mb" } } };

export default nextConfig;
