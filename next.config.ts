import type { NextConfig } from "next";

const isAndroidBuild = process.env.BUILD_TARGET === "android";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(isAndroidBuild
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        typescript: { ignoreBuildErrors: true },
      }
    : {}),

  // Izinkan Next.js melayani .wasm file dengan Content-Type yang benar
  // Diperlukan oleh @capacitor-community/sqlite (sql.js WebAssembly)
  async headers() {
    return [
      {
        source: "/:path*.wasm",
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
