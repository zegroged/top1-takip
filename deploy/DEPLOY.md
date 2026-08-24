# Fayans — Sunucu Deploy Notları

Hedef sunucu: `root@[SUNUCU]`. Fayans, mevcut **kafe** (dijitalkafe.com) kurulumunun
**yanına**, ayrı bir stack olarak kurulur. dijitalkafe.com'a dokunulmaz.

## Mimari
- Fayans kendi dizininde: `/root/fayans/` (kendi `docker-compose.prod.yml`).
- Servisler: `fayans-db`, `fayans-migrate`, `fayans-web` (expose 3000, dışa kapalı).
- 80/443 portları mevcut **kafe-nginx**'te. Fayans, `fayans_shared` adlı
  paylaşılan docker ağıyla nginx'e bağlanır.
- `to-p1.com` istekleri kafe-nginx'ten `fayans-web:3000`'e proxy'lenir.
- SSL zaten var: Cloudflare Origin cert `origin.crt` → `to-p1.com` + `*.to-p1.com` kapsıyor.
- Fotoğraflar `uploads` volume'unda; fayans-web `/foto/<dosya>` ile servis eder.

## 1) Kodu sunucuya gönder
```bash
# (yerelden) rsync veya git. Örnek rsync:
rsync -az --delete --exclude node_modules --exclude .next --exclude .git \
  ./ root@[SUNUCU]:/root/fayans/
```

## 2) Sunucuda .env oluştur (/root/fayans/.env)
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
cd /root/fayans
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f web   # kontrol
```

## 4) kafe-nginx'i fayans'a bağla (TEK production dokunuşu)
Yedek al:
```bash
cp /root/kafe/nginx/nginx.conf /root/kafe/nginx/nginx.conf.bak.$(date +%s)
cp /root/kafe/docker-compose.prod.yml /root/kafe/docker-compose.prod.yml.bak.$(date +%s)
```

### 4a) kafe docker-compose.prod.yml → nginx servisine paylaşılan ağı ekle
`nginx:` servisine:
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

### 4b) kafe nginx.conf → to-p1.com bloklarını değiştir
`upstream kafe_web {...}` yanına ekle:
```nginx
upstream fayans_web { server fayans-web:3000; }
```
Mevcut **iki `to-p1.com` redirect server bloğunu** (apex+www ve `~^(?<sub>.+)\.to-p1\.com$`)
SİL ve yerine şunu koy:
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

    ssl_certificate     /etc/nginx/certs/origin.crt;
    ssl_certificate_key /etc/nginx/certs/origin.key;

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
cd /root/kafe
docker compose -f docker-compose.prod.yml up -d nginx
docker exec kafe-nginx-1 nginx -t   # config testi
```

## 5) Doğrula
- https://to-p1.com → fayans ana sayfası
- https://to-p1.com/admin/giris → ilk admin kurulumu
- https://dijitalkafe.com → ETKİLENMEMELİ (hâlâ çalışıyor)

## Geri alma (rollback)
```bash
cp /root/kafe/nginx/nginx.conf.bak.<ts> /root/kafe/nginx/nginx.conf
cp /root/kafe/docker-compose.prod.yml.bak.<ts> /root/kafe/docker-compose.prod.yml
cd /root/kafe && docker compose -f docker-compose.prod.yml up -d nginx
```
