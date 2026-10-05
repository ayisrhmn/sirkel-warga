import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imported datasets are sent to a Server Action (validated to 3 MB; Vercel
  // itself caps request bodies at 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Protected data must never sit in a shared cache (CDN or browser).
        source: "/:communitySlug/protected/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
