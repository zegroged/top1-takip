"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, HardHat, MessageCircle, Phone } from "lucide-react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui";
import { COMPANY } from "@/lib/constants";

export type TourScene = {
  image: string;
  kicker?: string;
  title: string;
  text?: string;
  final?: boolean;
};

// Tek bölüm sinematik yürüyüş: scroll ilerledikçe sahneler crossfade + yavaş zoom
// ile akar (film gibi), yazılar sağ alttan gelir, sonda başa döner.
// Sadece opacity + transform + lerp yumuşatma → kasmasız.
export function CinematicTour({ scenes }: { scenes: TourScene[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const capRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cueRef = useRef<HTMLDivElement>(null);
  const N = scenes.length;
  const SCENE_VH = 95;

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;
      const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

      const render = (p: number) => {
        const s = p * (N - 1);
        for (let i = 0; i < N; i++) {
          const layer = layerRefs.current[i];
          const cap = capRefs.current[i];
          const d = s - i;
          const op = clamp(1 - Math.abs(d), 0, 1);
          const local = clamp(d + 0.5, 0, 1);
          const scale = 1.04 + local * 0.12;
          if (layer) {
            layer.style.opacity = op.toFixed(3);
            layer.style.transform = `translateZ(0) scale(${scale.toFixed(3)})`;
            layer.style.visibility = op < 0.01 ? "hidden" : "visible";
          }
          if (cap) {
            const capOp = clamp(1 - Math.abs(d) / 0.5, 0, 1);
            const off = (clamp(-d, 0, 1) * 46).toFixed(0);
            cap.style.opacity = capOp.toFixed(3);
            cap.style.transform = `translate3d(${off}px, ${off}px, 0)`;
            cap.style.visibility = capOp < 0.01 ? "hidden" : "visible";
          }
        }
        if (cueRef.current) cueRef.current.style.opacity = clamp(1 - s / 0.3, 0, 1).toFixed(3);
      };

      // Scroll + yumuşatma Lenis + ScrollTrigger'dan; bespoke rAF/lerp döngüsü kaldırıldı.
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: (self) => render(self.progress),
      });

      render(0);
    },
    { scope: trackRef, dependencies: [N] },
  );

  return (
    <section ref={trackRef} className="relative" style={{ height: `${N * SCENE_VH}vh` }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#0f0d0b]">
        {/* Sahne katmanları */}
        {scenes.map((sc, i) => (
          <div
            key={i}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{ backgroundImage: `url(${sc.image})`, opacity: i === 0 ? 1 : 0, transformOrigin: "50% 50%" }}
          />
        ))}

        {/* Okunabilirlik */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45" />

        {/* Üst bar (sabit) */}
        <div className="absolute inset-x-0 top-0 z-30">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-white">
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
        </div>

        {/* Yazılar (sağ alt) */}
        {scenes.map((sc, i) => (
          <div
            key={i}
            ref={(el) => {
              capRefs.current[i] = el;
            }}
            className="absolute bottom-16 right-5 z-20 max-w-md text-right text-white sm:bottom-20 sm:right-10"
            style={{ opacity: i === 0 ? 1 : 0, willChange: "transform, opacity" }}
          >
            {sc.kicker ? (
              <span className="ml-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <HardHat className="h-3.5 w-3.5" /> {sc.kicker}
              </span>
            ) : null}
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-cine sm:text-5xl">{sc.title}</h2>
            {sc.text ? <p className="mt-3 text-base text-white/85 text-cine sm:text-lg">{sc.text}</p> : null}
            {sc.final ? (
              <div className="mt-5 flex flex-col items-end gap-3">
                <Link href="/giris">
                  <Button size="lg">Projemi Takip Et <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <a href={COMPANY.phoneHref} className="flex items-center gap-2 text-white/90 hover:text-white">
                  <Phone className="h-4 w-4" /> {COMPANY.phone}
                </a>
                <a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/90 hover:text-white">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <span className="text-xs text-white/55">başa dönmek için yukarı kaydırın</span>
              </div>
            ) : null}
          </div>
        ))}

        {/* Aşağı kaydır */}
        <div ref={cueRef} className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-1 text-white/70">
          <span className="text-xs">aşağı kaydır</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
