import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Yüklenen görseli optimize edip (webp, max 1600px) diske yazar, dosya adını döner.
export async function saveImage(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  const optimized = await sharp(buf)
    .rotate() // EXIF yönüne göre döndür
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  await writeFile(path.join(UPLOAD_DIR, filename), optimized);
  return filename;
}

// Diskten güvenli okuma (path traversal koruması: sadece dosya adı).
export async function readImage(name: string): Promise<Buffer | null> {
  const safe = path.basename(name);
  if (safe !== name) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, safe));
  } catch {
    return null;
  }
}

export function uploadsDir(): string {
  return UPLOAD_DIR;
}
