import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  Clock,
  Cog,
  Disc3,
  Gauge,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Settings,
  ShieldCheck,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { PartsHero } from "@/components/parts-hero";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui";
import { COMPANY, PART_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const CAT_ICONS: Record<string, typeof Cog> = {
  motor: Cog,
  fren: Disc3,
  suspansiyon: Gauge,
  kaporta: CarFront,
  elektrik: Zap,
  sanziman: Settings,
};

const FEATURES = [
  { icon: Truck, title: "Hızlı Temin", desc: "Geniş stok ve tedarik ağıyla parçanız en kısa sürede elinizde." },
  { icon: ShieldCheck, title: "Orijinal & Eşdeğer", desc: "Bütçenize uygun, garantili parça seçenekleri." },
  { icon: Wrench, title: "Servis & Montaj", desc: "Parça satışından profesyonel montaja kadar tek elden." },
  { icon: Clock, title: "Canlı Takip", desc: "Aracınızın onarım sürecini kendi panelinizden izleyin." },
];

export default function HomePage() {
  return (
    <main className="bg-background text-foreground">
      <PartsHero />

      {/* Parça kategorileri */}
      <section id="kategoriler" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-primary">Ürünler</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Aradığınız parça, hangi sistemde olursa olsun.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PART_CATEGORIES.map((c, i) => {
              const Icon = CAT_ICONS[c.key] ?? Cog;
              return (
                <Reveal key={c.key} delay={i * 60}>
                  <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Neden biz */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Neden {COMPANY.short}?</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="flex flex-col gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Müşteri takip CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12">
              <div className="pointer-events-none absolute inset-0 tech-grid opacity-20" />
              <div className="relative">
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Aracınızı servise mi bıraktınız?
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Size verdiğimiz müşteri numarasıyla giriş yapın; onarımın hangi aşamada olduğunu,
                  fotoğraflarıyla birlikte canlı görün.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/giris" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Müşteri Girişi <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={COMPANY.phoneHref} className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      <Phone className="h-4 w-4" /> {COMPANY.phone}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-secondary">
                  <Wrench className="h-5 w-5 text-primary" />
                </span>
                <span className="text-lg font-semibold">{COMPANY.short}</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{COMPANY.tagline}</p>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <a href={COMPANY.phoneHref} className="flex items-center gap-2 hover:text-foreground">
                <Phone className="h-4 w-4 text-primary" /> {COMPANY.phone}
              </a>
              <a
                href={COMPANY.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4 text-primary" /> {COMPANY.email}
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {COMPANY.address}
              </span>
            </div>
          </div>
          <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {COMPANY.name}. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </main>
  );
}
