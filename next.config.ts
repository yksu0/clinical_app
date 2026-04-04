import type { NextConfig } from "next";

// Extract hostname from NEXT_PUBLIC_SUPABASE_URL for next/image remote patterns
// e.g. https://abcxyz.supabase.co  →  abcxyz.supabase.co
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHostname = supabaseUrl.replace(/^https?:\/\//, "").split("/")[0];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname }]
      : [],
  },
};

export default nextConfig;
