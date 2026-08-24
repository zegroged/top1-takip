# Fayans — Web Sitesi + Müşteri Takip Paneli

Bir fayans/uygulama firması için tanıtım sitesi, **müşteri takip paneli** ve **admin paneli**.
Admin müşteriye numara verir; müşteri sadece numarayla giriş yapıp projesinin durumunu,
teslim tarihini ve fotoğraflarını canlı takip eder.

## Teknoloji
Next.js 15 (App Router, standalone) · React 19 · Prisma 7 + PostgreSQL 16 ·
Tailwind v4 · jose (oturum) · sharp (görsel) · Docker.

## Yerel geliştirme
```bash
npm install
docker compose up -d            # Postgres (5432)
cp .env.example .env            # değerleri doldur (SESSION_SECRET üret)
npx prisma migrate dev          # şema + migration
npm run db:seed                 # ilk admin (admin / admin123)
npm run dev                     # http://localhost:3000
```

## Sayfalar
- `/` — tanıtım sitesi (scroll animasyonlu)
- `/giris` — müşteri girişi (sadece müşteri numarası)
- `/takip` — müşteri paneli (durum, aşamalar, fotoğraflar, teslim tarihi)
- `/admin/giris` — admin girişi / ilk kurulum
- `/admin` — müşteri listesi + yeni müşteri
- `/admin/musteri/[id]` — müşteri detayı: bilgiler, aşama, güncelleme + fotoğraf

## Aşamalar
`src/lib/stages.ts` içinde tanımlı. Firma akışına göre buradan güncellenir.

## Deploy
Sunucuya kurulum adımları: [deploy/DEPLOY.md](deploy/DEPLOY.md).
Hedef: `to-p1.com`, sunucu `[SUNUCU]` (mevcut kafe/dijitalkafe yanında, ayrı stack).
