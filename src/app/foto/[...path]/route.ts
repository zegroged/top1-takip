import { readImage } from "@/lib/uploads";

// Yüklenen görselleri diskten servis eder: /foto/<filename>
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const name = path?.[path.length - 1] ?? "";
  const buf = await readImage(name);
  if (!buf) {
    return new Response("Bulunamadı", { status: 404 });
  }
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
