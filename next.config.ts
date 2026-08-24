import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker imajı için bağımsız (standalone) çıktı.
  output: "standalone",
  // Prisma client'ı sunucu tarafında bundle dışı tut.
  serverExternalPackages: ["@prisma/client"],
  // Fotoğraf yüklemeleri Server Action ile gider; varsayılan 1MB limitini yükselt.
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  // Production build'i ESLint hatalarına takma (tip kontrolü açık kalır).
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
