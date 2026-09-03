# TOP1 Takip

> Küçük atölyeler için bir iş takip paneli: yönetici müşteriye 8 haneli bir numara verir ve o numara girişin tamamıdır. Parola yok, hesap yok, uygulama yok.

**Canlı demo: [to-p1.com](https://to-p1.com)** · [English README](README.md)

![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?style=flat-square&logo=docker)
![Lisans: AGPL v3](https://img.shields.io/badge/Lisans-AGPL%20v3-blue)

**Nasıl yazıldı:** kod yapay zekâ yardımıyla yazıldı ve yazar tarafından gözden geçirildi.

## Genel bakış

Küçük atölyeler — bir fayans ustası, bir oto tamirci — her günün gerçek bir bölümünü aynı telefona kaptırır: *"bitti mi?"* Sahibin sistemi yoktur, dolayısıyla cevap sözlü bir tahmindir ve müşteri yarın yine arar. Akla gelen çözüm bir müşteri portalıdır, ama alışıldık portal bu kitle için yanlıştır: arabasını iki hafta boyunca altı kez soracak biri, hesap açıp e-posta doğrulayıp parola ezberleyecek biri değildir.

Bu proje hesabı tamamen ortadan kaldırıyor. Yönetici bir müşteri kaydı oluşturur ve sistem rastgele 8 haneli bir numara üretir. Müşteri o numarayı yazar — başka hiçbir şey yazmaz — ve kendi işinin salt-okunur canlı görünümüne düşer: tamamlanma yüzdesi olan sıralı bir kontrol listesi, tahmini teslim tarihi ve atölyede çekilmiş fotoğraflarla tarihli bir güncelleme akışı. Yönetici tarafı bunun aynadaki hâlidir: müşteriyi oluştur, varsayılan görev listesini yükle, görevleri işaretle, sıralarını değiştir ve fotoğraflı tarihli bir güncelleme yayınla — müşterinin ekranında anında görünür.

Kod tabanı önce bir fayans ve tadilat ustası için yazıldı — depo dizini hâlâ `fayans` — ve aynı mekanik sonra oto yedek parça ve araç tamir takibine uyarlandı; bugün to-p1.com'da çalışan da bu. Takip çekirdeği (müşteriler, görevler, güncellemeler, fotoğraflar) ikisi arasında hiç değişmedi; yalnızca görev sözlüğü ve tanıtım ana sayfası değişti. Bu dağıtımın gerçekte ne olduğu için [Durum](#durum) bölümüne bakın.

## Teknoloji

| Katman | Tercih |
|---|---|
| Çatı | Next.js 15 (App Router, React Server Components, Server Actions, `output: "standalone"`) |
| Arayüz | React 19, Tailwind CSS v4 (`@theme` token'ları, OKLCH paleti), lucide-react; `sonner`'ın `<Toaster />` bileşeni layout'a takılı ama henüz hiçbir yerden toast tetiklenmiyor |
| Veri | `pg` driver adapter ile Prisma 7, PostgreSQL 16 |
| Kimlik | `jose` — httpOnly çerezde HS256 JWT; yönetici parolası için `bcryptjs` |
| Medya | `sharp` (EXIF farkında yeniden boyutlandırma, WebP) |
| Animasyon | GSAP 3 + `@gsap/react`, IntersectionObserver |
| Doğrulama | Zod 4 (ortam şeması, import anında doğrulanır) |
| Dağıtım | Çok aşamalı Dockerfile, Docker Compose, mevcut bir nginx ters vekil + Cloudflare arkasında |

**Boyut:** 37 TypeScript/TSX dosyası, `src/` altında ~3.500 satır · 6 Prisma modeli · 7 sayfa · 19 Server Action · 1 route handler · 0 otomatik test (bkz. [Bilinen sınırlamalar](#bilinen-sınırlamalar)). `src/generated/` altındaki üretilmiş Prisma istemcisi gitignore'da ve sayıma dahil değil.

## Özellikler

### Müşteri (`/giris`, `/takip`)

- Yalnızca müşteri numarasıyla giriş. Parola alanı diye bir şey yok.
- Canlı iş özeti: ad, iş başlığı, müşteri numarası, tahmini teslim tarihi, adres.
- İlerleme çubuğu ve `n/toplam` sayacı olan sıralı görev listesi.
- Tarihli güncelleme akışı; her güncelleme isteğe bağlı olarak bir göreve bağlı ve fotoğraf taşıyabiliyor.
- Çıkış, oturum çerezini temizler.

### Yönetici (`/admin/giris`, `/admin`, `/admin/musteri/[id]`, `/admin/vitrin`)

- **İlk kurulum:** `admins` tablosu boşken `/admin/giris` giriş formu yerine "ilk yöneticiyi oluştur" formu gösterir; sonrasında giriş formuna döner.
- **Müşteri listesi**; ad, müşteri numarası, telefon ve iş başlığı üzerinde sunucu tarafı arama, her satırda canlı ilerleme.
- **Müşteri oluşturma**; isteğe bağlı "varsayılan görev listesini yükle" kutusuyla on standart tamir adımını sırayla ekler.
- **Müşteri detayı:** bilgileri düzenle, görev ekle / sırala (yukarı-aşağı takas) / işaretle / sil, daha fazla varsayılan görev ekle, not ve birden çok fotoğrafla tarihli güncelleme yayınla, güncelleme ve fotoğraf sil, müşteriyi sil (bağlı kayıtlar da silinir).
- **Vitrin yöneticisi** (`/admin/vitrin`): galeri görselleri yükle, sırala ve sil.
- Yıkıcı düğmeler, onaylanmadıkça form gönderimini iptal eden bir `ConfirmSubmit` istemci bileşeninden geçer.

### Genel site (`/`)

- Tek bir `<video>` öğesi üzerine kurulu, kaydırmayla sürülen bir açılış bölümü — masaüstü ve mobilde tamamen farklı iki etkileşim kipiyle (aşağıya bakın) — kaydırdıkça beliren parça kategorisi ve değer önerisi bölümleri, ve müşteri girişine bir çağrı.

## Mimari / tasarım notları

**Müşteri numarası kimlik bilgisinin kendisidir ve tasarım bunu hesaba katar.** Bu, projenin taşıyıcı kararıdır, dolayısıyla çevresindeki kodun onu hak etmesi gerekir. Numaralar `crypto.randomInt` ile üretilen 8 hanedir ve boş bir tane bulunana dek tekil indekse karşı 25 kez yeniden denenir — ardışık değildir, yani bilinen bir numaradan sayarak numaralandırılamazlar. Giriş eylemi istemci IP'sine göre hız sınırlar (müşteri için dakikada 8 deneme, yönetici için 5) ve bu, ~90 milyonluk alanı tahmin etmeyi pratik olmaktan çıkarır. Müşteri görünümü kesinlikle salt okunurdur; bir müşteri oturumunun çıkış yapmak dışında alabileceği hiçbir eylem yoktur. Tehdit modeli dürüstçe *"bir komşu tamir faturanızı okuyamamalı"*dır, *"bu sırları korur"* değil — ve sınırlamalar bölümü bunu söyler.

**Tek bir rol alanı değil, birbirinden bağımsız iki oturum ad alanı.** `src/lib/session.ts` ayrı çerez adları altında (`fayans_admin`, `fayans_customer`) ayrı imzalı JWT'ler üretir ve yönlendirme yapan `requireAdmin()` / `requireCustomer()` korumalarını dışa verir. Elinde müşteri çerezi olmak yönetici durumuna hiçbir yol açmaz, çünkü yönetici koruması tamamen başka bir çerez okur. Çerezler httpOnly, `sameSite: lax`, üretimde `secure` ve jetonla eşleşen 30 günlük süreye sahiptir.

**REST API yok — Server Action var, bilinçli tek istisnayla.** 19 Server Action'ın hepsi onları kullanan sayfalarla aynı yerde durur. Yöneticiye ait veriye dokunan 14 tanesi `await requireAdmin()` ile başlar, dolayısıyla yetkilendirme, var olmayan bir yol sınırında unutulamaz. Diğer beşi kimlik doğrulama eylemlerinin kendisidir — ilk kurulum, yönetici girişi, müşteri girişi ve iki çıkış — ki bunlar zorunlu olarak bir oturum var olmadan önce ya da sonra çalışır; `setupAdmin` ise `admins` tablosu boş değilse hiçbir şey yapmayı reddederek kendini korur. Tek route handler olan `/foto/[...path]`, yüklenen fotoğraflar derleme çıktısında değil bir Docker volume'ünde durduğu için vardır: `src/lib/uploads.ts` içindeki `readImage()` fonksiyonuna devreder, o da `path.basename(name) !== name` olan her şeyi yol geçişi sayıp reddeder ve dosyayı `Cache-Control: public, max-age=31536000, immutable` ile döndürür — dosya adları UUID olduğu ve asla tekrar kullanılmadığı için bu güvenlidir.

**İlerleme hesabı saf ve paylaşılmıştır.** `src/lib/tasks.ts` içindeki `computeProgress` ve `countDone` yalnızca bir `{ done: boolean }[]` alır — Prisma tipi yok, IO yok. Üç ayrı sayfa (yönetici listesi, yönetici detayı, müşteri görünümü) aynı iki fonksiyonu içe aktarır, dolayısıyla müşterinin gördüğü yüzde ile yöneticinin gördüğü yüzde birbirinden ayrışamaz. Bu aynı zamanda projede birim testi yazmaya en kolay başlanacak iki fonksiyonun bunlar olduğu anlamına gelir.

**Yüklemeler çıkışta değil, girişte normalleştirilir.** `saveImage()` her yüklemeyi sharp'tan geçirir: EXIF yönünü kalıcı hâle getirmek için `.rotate()` (atölyeden gelen telefon fotoğrafları aksi hâlde yan gelir), büyütmeden 1600×1600 içine sığacak şekilde yeniden boyutlandırma, sonra kalite 80 ile WebP ve yeni bir UUID altına yazma. Orijinal hiç saklanmaz. 30 MB'lık tavan, birbiriyle uyuşması gereken iki yerde tanımlıdır — `next.config.ts` içindeki `serverActions.bodySizeLimit` ve dağıtım notlarındaki nginx parçasındaki `client_max_body_size`.

**Ortam doğrulaması derleme anında çalışır ve bu Dockerfile'ı biçimlendirir.** `src/lib/env.ts`, modül import edilirken `process.env` değerlerini bir Zod şemasından geçirir; böylece eksik bir `DATABASE_URL` ya da kısa bir `SESSION_SECRET`, çalışma anında bir null olarak ortaya çıkmak yerine gürültüyle başarısız olur. Bu import `next build` sırasında da çalıştığı için builder aşaması bariz, tek kullanımlık yer tutucular verir ve gerçek sırlar çalışma anında `env_file` ile gelir — yer tutucu, önemli hiçbir imaj katmanına ulaşmaz. `NEXT_PUBLIC_*` değerleri ise tam tersidir: derleme anında istemci paketlerine gömülürler, bu yüzden alan adı çalışma zamanı değişkeni olarak değil Docker build argümanı olarak geçirilir.

**Migration'lar birinin hatırlaması gereken bir dağıtım adımı değil, bir compose bağımlılığıdır.** Dockerfile'da tek işi `prisma migrate deploy` olan ayrı bir `migrator` hedefi vardır. `docker-compose.prod.yml` içinde `migrate` veritabanı sağlık kontrolünü, `app` ise `migrate` servisinin `condition: service_completed_successfully` ile bitmesini bekler. Başarısız bir migration, uygulamayı eskimiş bir şemaya karşı başlatmak yerine sürümü durdurur.

**Sahibi olmadığı servislerle aynı makineyi paylaşır.** Üretim yığını harici bir Docker ağına (`fayans_shared`) katılır ve kendini yalnızca `fayans-web:3000` ağ takma adı olarak yayınlar, hiçbir host portu açmaz. O makinedeki mevcut nginx 80/443'ü elinde tutar ve bir server bloğunu bu takma ada vekiller. Servis `web` değil `app` diye adlandırılmıştır; bu özellikle ters vekilin kendi upstream adlandırmasıyla çakışmasın diyedir — insanın ancak bir kez başına geldikten sonra yazdığı türden bir ayrıntı.

**Animasyon kararları, geri alındıkları dosyalarda birer geri alma olarak belgelenmiştir.** Lenis yumuşak kaydırma, masaüstünde fare tekerleğini gasp edip mobilde dokunmatik kaydırmayı kilitlediği için kaldırıldı; `SmoothScroll` artık yalnızca layout import'u kırılmasın diye tutulan geçirgen bir bileşen ve gerekçesi dosyanın içinde. `Reveal` bilinçli olarak GSAP ScrollTrigger yerine IntersectionObserver kullanır, çünkü mobil adres çubuğunun kapanması görünüm yüksekliğini değiştirir ve bir ScrollTrigger eşiğini hiç tetiklenmemiş bırakabilir — içeriği `opacity: 0` hâlinde mahsur bırakır — üstüne, gözlemci hiç tetiklenmezse içeriği koşulsuz açan 1,5 saniyelik bir yedek zamanlayıcı eklenmiştir. Açılış bölümü tek bir `<video>` üzerinde iki farklı uygulama çalıştırır: masaüstü, biriken kaydırma farkından `currentTime` değerini sürer ve kaydırma durunca klibi 0,8× hızla oynatmaya geçer (24 fps'lik bir kaynağı yavaş sürmek ~3 fps gibi görünürken oynatma akıcı kalır); mobil ise sürmeyi tamamen bırakıp elle seçilmiş dört "patlatılmış görünüm" karesi arasında dokunarak ilerlemeye geçer ve aralarını 1,6× hızla oynatır, çünkü mobil kod çözücülerde arama takılır. Üç animasyonlu yolun üçü de — masaüstü açılışı, mobil açılışı ve `Reveal` — `prefers-reduced-motion` tercihine uyar.

**Küçük bir Next 15 doğruluk ayrıntısı.** Next 15'te render sırasında çerezler değiştirilemez, dolayısıyla `/takip`, müşterinin silindiğini fark ettiğinde bayat çerezi temizleyemez — yalnızca yönlendirebilir. Bu yüzden `/giris`, çerez taşıyan birini `/takip` sayfasına geri göndermeden önce müşterinin veritabanında hâlâ var olduğunu yeniden doğrular; iki sayfanın sonsuza dek birbirine sekmesini engelleyen budur. Gerekçe, her yönlendirmenin üstünde yorum olarak yazılıdır.

## Başlarken

Node 22+ ve Docker gerekir.

```bash
git clone <depo-url> && cd fayans
npm install

docker compose up -d          # :5432 üzerinde PostgreSQL 16

cp .env.example .env          # sonra aşağıdaki değerleri doldur
npx prisma migrate dev        # şemayı uygula + istemciyi üret
npm run db:seed               # ilk yöneticiyi oluştur
npm run dev                   # http://localhost:3000
```

`.env.example`, uygulamanın kendisinin okuduğu her değişkeni belgeler. Üretim compose dosyası ayrıca `DB_PASSWORD` bekler; o, burada değil [deploy/DEPLOY.md](deploy/DEPLOY.md) içinde belgelenmiştir. Yerel geliştirme için ayarlanması zorunlu olan ikisi:

- `DATABASE_URL` — geliştirme varsayılanı zaten `docker-compose.yml` ile eşleşiyor.
- `SESSION_SECRET` — en az 16 karakter, yoksa açılış doğrulamada başarısız olur. Üretmek için:
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

`npm run db:seed`, `ADMIN_USERNAME` ve `ADMIN_PASSWORD` ayarlanmadıysa `admin` / `admin123` oluşturur. **Yalnızca yerel kullanım için.** Üretimde tabloyu boş bırakın ve ilk yöneticiyi `/admin/giris` adresindeki kurulum formundan oluşturun.

Sonrası: `/admin/giris` adresinden giriş yap, bir müşteri oluştur, üretilen 8 haneli numarayı kopyala ve müşterinin tarafını görmek için gizli bir pencerede `/giris` adresini aç.

Üretim dağıtımı — Docker yığını, paylaşılan ağ, nginx server bloğu, geri alma adımları — [deploy/DEPLOY.md](deploy/DEPLOY.md) içinde belgelenmiştir (Türkçe).

## Bilinen sınırlamalar

Bilerek yazıldı; hiçbiri kodu okuyandan gizlenmiyor.

- **Otomatik test yok.** Depoda sıfır test dosyası ve `package.json` içinde test koşucusu yok. `src/lib/tasks.ts` ve `src/lib/stages.ts` saf ve doğal başlangıç noktası olurdu, ama proje hiç test yazılmadan durdu.
- **Hız sınırlayıcı süreç içi bellekte.** `src/lib/ratelimit.ts` Node sürecinde bir `Map`. Yazıldığı tek konteynerli dağıtım için doğru, birden fazla kopya arkasında işe yaramaz ve her yeniden başlatmada sıfırlanır. Redis ya da veritabanı doğru düzeltme olurdu.
- **Fotoğraflar nesne depolamada değil, yerel bir Docker volume'ünde.** Bu, uygulamayı tek bir makineye bağlar ve yedekleme, operatörün o volume'e ne yaptığından ibarettir. Bir `Photo` ya da `ProgressUpdate` satırını silmek veritabanı kaydını kaldırır ama dosyayı **silmez**, dolayısıyla diskte öksüz WebP dosyaları birikir. Temizlik işi yok.
- **Müşteri numarası, döndürülmeyen ve süresi dolmayan bir taşıyıcı jetondur.** Numaraya sahip olan herkes — yanlış kişiye iletilmiş bir mesaj, omzunun üstünden okuyan biri — o işi görebilir. Hız sınırlama tahmin etmeyi yavaşlatır; paylaşımı çözmez. Bir tamir durumu sayfası için kabul edilebilir, hassas hiçbir şey için değil.
- **`src/lib/stages.ts` ölü kod.** Altı aşamalı bir hat (alındı → teşhis → parça tedariği → montaj → test → hazır) ve ilerleme yardımcıları içeriyor; yorumları `Customer.currentStage` ve `ProgressUpdate.stage` alanlarına atıf yapıyor — bunlar Prisma şemasında yok. Müşteri başına görev listesi bu tasarımın yerini aldı ve dosya hiç silinmedi.
- **Vitrin galerisi yarım bağlı.** `/admin/vitrin` `ShowcaseItem` satırlarını doğru yüklüyor, sıralıyor ve siliyor; ama mevcut oto yedek parça ana sayfası onları hiç sorgulamıyor, dolayısıyla dışarıya hiçbir şey basılmıyor. Galeri bölümü ana sayfanın eski fayans sürümüne aitti.
- **Önceki sürümden kalan kullanılmayan bileşenler ağaçta duruyor**, video varlıklarıyla birlikte: `video-tour`, `video-scene-tour`, `cinematic-tour`, `flythrough-hero`, `scroll-hero`, `parallax`, `big-list`, artı açılış bölümünün artık kullanmadığı bir yaklaşımdan kalan `public/frames/` altındaki 60 önceden üretilmiş WebP karesi. Bir sayfadan erişilebilen yalnızca `parts-hero`, `reveal`, `smooth-scroll`, `confirm-submit` ve `ui`.
- **Arayüz yalnızca Türkçe.** Tüm metinler bileşenlerin içine gömülü; i18n katmanı yok.
- **Üretim derlemelerinde ESLint atlanıyor** (`next.config.ts` içinde `eslint.ignoreDuringBuilds: true`), böylece bir lint uyarısı dağıtımı engelleyemiyor. TypeScript kontrolü yine de çalışıyor. CI hattı yok.
- **Görev sıralaması sürükle-bırak değil, komşuyla yukarı/aşağı takas** ve her hamlede bir işlem içinde iki satır yeniden yazılıyor. Müşteri başına on görev ölçeğinde sorun değil.

## Durum

**Bu bir demo ve hep öyle olması amaçlandı.** to-p1.com gerçek bir atölyenin müşterilerine hizmet etmiyor. Onu çalışan bir referans olarak yaptım ki şehrimdeki oto tamircilere ve yedek parçacılara girip anlatmak yerine gerçek bir alan adında gerçek bir sistem gösterebileyim — "müşterileriniz bunu görürdü; ister misiniz?" `src/lib/constants.ts` içindeki şirket adı, telefon numarası ve metinler yer tutucudur ve kod bunu yorumlarında söyler.

**Gerçek kullanım: sıfır müşteri.** Hiçbir atölye benimsemedi. Sunum yapmayı bıraktım ve proje artık geliştirilmiyor.

Yayımlanıyor, çünkü kod nasıl çalıştığımın adil bir örneği: gerçek bir veritabanı şeması, alışılmadık ve savunulmuş bir kısıtla gerçek bir kimlik doğrulama, sahibi olmadığı servislerle bir arada yaşayan bir üretim Docker dağıtımı ve bir kez yanlış yapıp geri alırken belgelediğim bir dizi animasyon kararı. Önceki fayans ustası sürümü ile oto yedek parça sürümü aynı takip çekirdeğini paylaşır; önce onu gösteririm.

## Lisans

AGPL-3.0 — bkz. [LICENSE](LICENSE).

AGPL bilinçli bir tercih. Bu, öğretici bir örnek olarak değil, atölyelere sunmak için çalışan bir demo olarak yapıldı ve bir taslak değil, tamamlanmış ve dağıtılmış bir sistem. Herkes inceleyebilir, değiştirebilir ve çalıştırabilir — ama değiştirilmiş bir sürümü ağ üzerinden servis olarak çalıştırmak, o sürümün kaynağını yayımlamak demektir. Telif yazarda olduğu için ayrı ticari şartlar talep üzerine düzenlenebilir.
