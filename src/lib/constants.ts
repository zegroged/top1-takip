// Client + server tarafında güvenle kullanılabilir sabitler.
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "to-p1.com";

// NOT: Marka adı + iletişim bilgileri GEÇİCİ (placeholder). Kullanıcı gerçek
// firma adını/telefonunu verince burası güncellenecek.
export const APP_NAME = "TOP1 Oto Yedek Parça";

// İletişim telefonu ortam değişkeninden gelir. constants.ts client bileşenlerinde de
// kullanıldığı için değişkenin NEXT_PUBLIC_ önekli olması gerekir (build'de gömülür).
// Yerel gerçek değer .env'de (gitignore'lu) tutulur; yoksa boş yer tutucu kullanılır.
const COMPANY_PHONE = process.env.NEXT_PUBLIC_FIRMA_TELEFON ?? "";
// Tek telefon değerinden türet (phoneHref/whatsapp'i tekrar sabit yazma):
// rakamları çıkar, ülke kodu (90) veya baştaki 0'ı at → 10 haneli ulusal numara.
const COMPANY_PHONE_NATIONAL = COMPANY_PHONE.replace(/\D/g, "").replace(/^(?:90|0)/, "");
const COMPANY_PHONE_INTL = COMPANY_PHONE_NATIONAL ? `90${COMPANY_PHONE_NATIONAL}` : "";

export const COMPANY = {
  name: "TOP1 Oto Yedek Parça",
  short: "TOP1 PARÇA",
  tagline: "Her marka, her parça — hızlı temin, garantili",
  description:
    "Binek ve ticari araçlar için motor, fren, süspansiyon, kaporta ve elektrik parçaları. Tüm markalar tek adreste; orijinal/eşdeğer seçenekler, hızlı temin ve servis.",
  phone: COMPANY_PHONE,
  phoneHref: COMPANY_PHONE_INTL ? `tel:+${COMPANY_PHONE_INTL}` : "",
  whatsapp: COMPANY_PHONE_INTL ? `https://wa.me/${COMPANY_PHONE_INTL}` : "",
  email: "info@to-p1.com",
  address: "Konya, Türkiye",
};

// Ana sayfada vitrinlenen parça kategorileri (içerik geçici, kullanıcı netleştirince güncellenir).
export const PART_CATEGORIES = [
  { key: "motor", title: "Motor Parçaları", desc: "Piston, conta, triger, devirdaim, yağ/hava/yakıt filtreleri ve daha fazlası." },
  { key: "fren", title: "Fren Sistemi", desc: "Disk, balata, kaliper, fren hidroliği ve ABS bileşenleri." },
  { key: "suspansiyon", title: "Süspansiyon & Alt Takım", desc: "Amortisör, helezon yay, rotil, salıncak, rotbaşı." },
  { key: "kaporta", title: "Kaporta & Dış Donanım", desc: "Tampon, far, kaput, çamurluk, ayna ve ızgara." },
  { key: "elektrik", title: "Elektrik & Aksesuar", desc: "Akü, marş, alternatör, sensör, buji ve kablo tesisatı." },
  { key: "sanziman", title: "Şanzıman & Aktarma", desc: "Debriyaj, aks, kavrama, şanzıman parçaları." },
];
