import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker imajı için minimal sunucu çıktısı
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Yönetimden görsel yüklenir (en çok 8 MB); varsayılan 1 MB sınırı yetmez.
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  // sharp'ın yerel kütüphaneleri (libvips) dosya izleyiciye görünmez; standalone çıktıya elle eklenir.
  outputFileTracingIncludes: { "/*": ["node_modules/sharp/**/*", "node_modules/@img/**/*"] },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
