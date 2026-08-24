"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, HardHat, Phone } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui";
import { COMPANY } from "@/lib/constants";

// Scroll'a kilitli "yazının içinden uçma" hero'su (mobil uyumlu + yumuşatmalı).
// Akıcılık: sürekli rAF + lerp ile hedef ilerlemeye yumuşak yaklaşım (scroll jitter'ı yutar).
export function FlyThroughHero() {
  const trackRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const img2Ref = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rectWRef = useRef<SVGRectElement>(null);
  const rectFRef = useRef<SVGRectElement>(null);
  const t1Ref = useRef<SVGTextElement>(null);
  const t2Ref = useRef<SVGTextElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;
      const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
      const map = (v: number, i0: number, i1: number, o0: number, o1: number) =>
        o0 + (o1 - o0) * clamp((v - i0) / (i1 - i0), 0, 1);

      // SVG viewBox + maske yazısını ekran boyutuna göre ölçekle.
      const size = () => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        svgRef.current?.setAttribute("viewBox", `0 0 ${W} ${H}`);
        for (const r of [rectWRef.current, rectFRef.current]) {
          r?.setAttribute("width", String(W));
          r?.setAttribute("height", String(H));
        }
        const f2 = Math.min(W * 0.22, H * 0.155);
        const f1 = f2 * 1.25;
        const y1 = H * 0.45;
        const y2 = y1 + f1 * 0.85;
        if (t1Ref.current) {
          t1Ref.current.setAttribute("x", String(W / 2));
          t1Ref.current.setAttribute("y", String(y1));
          t1Ref.current.setAttribute("font-size", String(f1));
        }
        if (t2Ref.current) {
          t2Ref.current.setAttribute("x", String(W / 2));
          t2Ref.current.setAttribute("y", String(y2));
          t2Ref.current.setAttribute("font-size", String(f2));
        }
      };

      // p (0..1) → efekt değerleri.
      const render = (p: number) => {
        const baseScale = map(p, 0, 0.55, 1.0, 1.1);
        const zoom = p < 0.5 ? 1 : map(p, 0.5, 1, 1, 6);
        const maskOp = map(p, 0.18, 0.44, 0, 1) * map(p, 0.78, 0.98, 1, 0);
        if (zoomRef.current)
          zoomRef.current.style.transform = `translateZ(0) scale(${(baseScale * zoom).toFixed(3)})`;
        if (maskRef.current) maskRef.current.style.opacity = maskOp.toFixed(3);
        if (img2Ref.current) img2Ref.current.style.opacity = map(p, 0.52, 0.82, 0, 1).toFixed(3);
        if (heroRef.current) heroRef.current.style.opacity = map(p, 0, 0.18, 1, 0).toFixed(3);
        if (cueRef.current) cueRef.current.style.opacity = map(p, 0, 0.1, 1, 0).toFixed(3);
      };

      // Erişilebilirlik: prefers-reduced-motion'a göre iki ayrı kurulum.
      // gsap.matchMedia, eşik değişince ilgili kurulumu otomatik revert eder.
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { reduce } = ctx.conditions as { motion: boolean; reduce: boolean };
          size();
          if (reduce) {
            // Animasyon kapalı: tek ekran, hero sabit görünür.
            track.style.height = "100svh";
            render(0);
            if (heroRef.current) heroRef.current.style.opacity = "1";
            return;
          }
          // Tam efekt: scroll'a kilitli, yumuşatmayı Lenis sağlar.
          track.style.height = "520vh";
          render(0);
          ScrollTrigger.create({
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            invalidateOnRefresh: true,
            onUpdate: (self) => render(self.progress),
            onRefresh: (self) => {
              size();
              render(self.progress);
            },
          });
        },
      );
    },
    { scope: trackRef },
  );

  return (
    <section ref={trackRef} className="relative" style={{ height: "520vh" }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#141210]">
        <div
          ref={zoomRef}
          className="absolute inset-0"
          style={{ transformOrigin: "50% 46%", willChange: "transform", backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/scene-salon.webp)" }} />
          <div ref={maskRef} className="absolute inset-0" style={{ opacity: 0, willChange: "opacity" }}>
            <svg ref={svgRef} className="h-full w-full" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
              <defs>
                <mask id="ftmask">
                  <rect ref={rectWRef} x="0" y="0" width="1280" height="720" fill="white" />
                  <text ref={t1Ref} x="640" y="335" textAnchor="middle" fontFamily="var(--font-geist-sans), Arial, sans-serif" fontWeight="800" letterSpacing="2" fill="black">ÖPÖZ</text>
                  <text ref={t2Ref} x="640" y="540" textAnchor="middle" fontFamily="var(--font-geist-sans), Arial, sans-serif" fontWeight="800" letterSpacing="2" fill="black">İNŞAAT</text>
                </mask>
              </defs>
              <rect ref={rectFRef} x="0" y="0" width="1280" height="720" fill="#141210" mask="url(#ftmask)" />
            </svg>
          </div>
        </div>

        <div ref={img2Ref} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/scene-fayans.webp)", opacity: 0 }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

        <div ref={heroRef} className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/65" />
          <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/30 bg-white/10 backdrop-blur">
                <HardHat className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold tracking-wide sm:text-lg">{COMPANY.short}</span>
            </div>
            <Link href="/giris">
              <Button size="sm" variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20">
                Müşteri Girişi
              </Button>
            </Link>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <HardHat className="h-3.5 w-3.5" /> {COMPANY.tagline}
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-cine sm:text-5xl md:text-7xl">
              Hayalinizdeki evi <span className="text-primary">kuruyoruz</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/85 text-cine sm:text-lg">{COMPANY.description}</p>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Link href="/giris" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">Projemi Takip Et <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <a href={COMPANY.phoneHref} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-white/40 bg-white/5 text-white hover:bg-white/15 sm:w-auto">
                  <Phone className="h-4 w-4" /> {COMPANY.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div ref={cueRef} className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-white/70">
          <span className="text-xs">aşağı kaydır</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
