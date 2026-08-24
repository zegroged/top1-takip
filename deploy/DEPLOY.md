# Fayans — Sunucu Deploy Notları

Fayans, üretim sunucusunda kendi **Docker stack**'i olarak çalışır. Aynı sunucuda
başka uygulamalar varsa Fayans onların **yanına**, ayrı ve bağımsız bir stack olarak
kurulur; mevcut servisler etkilenmez.

## Mimari
- Fayans kendi deploy dizininde çalışır (kendi `docker-compose.prod.yml`).
- Servisler: `fayans-db`, `fayans-migrate`, `fayans-web` (expose 3000, dışa kapalı).
- 80/443 portları sunucudaki **mevcut nginx reverse proxy**'dedir. Fayans, `fayans_shared`
  adlı paylaşılan docker ağıyla bu nginx'e bağlanır.
- `to-p1.com` istekleri nginx'ten `fayans-web:3000`'e proxy'lenir.
- SSL: Cloudflare Origin sertifikası nginx'te mount'ludur (`to-p1.com` + `*.to-p1.com`).
- Fotoğraflar `uploads` volume'unda; fayans-web `/foto/<dosya>` ile servis eder.

## 1) Kodu sunucuya gönder
```bash
# (yerelden) rsync veya git ile deploy dizinine gönder. Örnek rsync:
rsync -az --delete --exclude node_modules --exclude .next --exclude .git \
  ./ <kullanici>@<sunucu>:<deploy-dizini>/
```

## 2) Sunucuda .env oluştur (<deploy-dizini>/.env)
```env
NODE_ENV=production
DATABASE_URL="postgresql://fayans:GUCLU_DB_SIFRESI@db:5432/fayans?schema=public"
DB_PASSWORD="GUCLU_DB_SIFRESI"
SESSION_SECRET="<<openssl rand -base64 32>>"
NEXT_PUBLIC_ROOT_DOMAIN="to-p1.com"
NEXT_PUBLIC_APP_URL="https://to-p1.com"
# İlk admin (isteğe bağlı; panelden de kurulabilir)
ADMIN_USERNAME=""
ADMIN_PASSWORD=""
```
> Not: compose `web` servisi build arg olarak `NEXT_PUBLIC_ROOT_DOMAIN`'i .env'den alır.
> `DATABASE_URL` host'u `db` (compose servis adı), `DB_PASSWORD` ile aynı şifre olmalı.

## 3) Paylaşılan ağı oluştur + stack'i başlat
```bash
docker network create fayans_shared 2>/dev/null || true
cd <deploy-dizini>
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f web   # kontrol
```

## 4) Mevcut nginx reverse proxy'yi fayans'a bağla (TEK production dokunuşu)
Önce mevcut nginx yapılandırmasının (config + compose) yedeğini al.

### 4a) nginx servisine paylaşılan ağı ekle
Reverse proxy'nin `docker-compose` dosyasında `nginx:` servisine:
```yaml
    networks:
      - default
      - fayans_shared
```
ve dosya sonuna:
```yaml
networks:
  default: {}
  fayans_shared:
    external: true
```

### 4b) nginx.conf → to-p1.com upstream + server bloğu
Upstream ekle:
```nginx
upstream fayans_web { server fayans-web:3000; }
```
`to-p1.com` için server bloğu (varsa mevcut redirect/placeholder bloklarının yerine):
```nginx
# to-p1.com → FAYANS
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name to-p1.com www.to-p1.com *.to-p1.com;
    client_max_body_size 30m;
    server_tokens off;

    # Cloudflare Origin sertifikasının nginx'e mount edildiği yollar:
    ssl_certificate     <origin-cert-yolu>;
    ssl_certificate_key <origin-key-yolu>;

    location / {
        proxy_pass http://fayans_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 90s;
    }
}
```

### 4c) nginx'i yeni ağ + config ile yeniden oluştur
```bash
docker compose -f docker-compose.prod.yml up -d nginx
docker exec <nginx-container> nginx -t   # config testi
```

## 5) Doğrula
- https://to-p1.com → fayans ana sayfası
- https://to-p1.com/admin/giris → ilk admin kurulumu
- Sunucudaki diğer siteler → ETKİLENMEMELİ (hâlâ çalışıyor olmalı)

## Geri alma (rollback)
Yedeğini aldığın nginx config + compose dosyalarını geri koy, sonra nginx'i yeniden oluştur:
```bash
# yedekten geri yükle, ardından:
docker compose -f docker-compose.prod.yml up -d nginx
```
