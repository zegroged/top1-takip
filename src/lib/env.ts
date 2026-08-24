import { z } from "zod";

// Sunucu tarafı ortam değişkenleri (build sırasında da doğrulanır).
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // --- Zorunlu çekirdek ---
  DATABASE_URL: z.string().min(1, "DATABASE_URL gerekli"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET en az 16 karakter olmalı"),

  // --- Public ---
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().default("to-p1.com"),
  NEXT_PUBLIC_APP_URL: z.string().optional(),

  // --- İlk admin kurulumu (opsiyonel) ---
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

function parseEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Geçersiz ortam değişkenleri:\n",
      z.prettifyError(parsed.error),
    );
    throw new Error("Ortam değişkenleri doğrulanamadı. .env dosyanı kontrol et.");
  }
  return parsed.data;
}

export const env = parseEnv();
