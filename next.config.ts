import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // PDF.js v5 worker를 CDN 없이 로컬 번들로 해결
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.mjs': path.resolve(
        './node_modules/pdfjs-dist/build/pdf.worker.mjs'
      ),
    };
    return config;
  },
};

export default nextConfig;
