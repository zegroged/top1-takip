// Basit bellek içi hız sınırlayıcı (tek container için yeterli).
// Müşteri numarası tahmin saldırılarını yavaşlatmak için giriş ekranında kullanılır.

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    const retryAfterMs = windowMs - (now - arr[0]);
    hits.set(key, arr);
    return { ok: false, remaining: 0, retryAfterMs };
  }
  arr.push(now);
  hits.set(key, arr);
  return { ok: true, remaining: limit - arr.length, retryAfterMs: 0 };
}

// Ara sıra eski anahtarları temizle (bellek şişmesin).
let lastSweep = Date.now();
export function sweep(windowMs: number): void {
  const now = Date.now();
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [k, arr] of hits) {
    const fresh = arr.filter((t) => now - t < windowMs);
    if (fresh.length === 0) hits.delete(k);
    else hits.set(k, fresh);
  }
}
