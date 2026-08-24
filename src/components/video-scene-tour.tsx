"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, HardHat, MessageCircle, Phone } from "lucide-react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui";
import { COMPANY } from "@/lib/constants";

export type Scene = {
  type: "video" | "image";
  src: string;
  poster?: string;
  kicker?: string;
  title: string;
  text?: string;
  final?: boolean;
};

// Scroll'a bağlı sahne turu: kaydırdıkça GÖRSEL + YAZI birlikte değişir (crossfade).
// Her video sahnesi aktifken kendi içinde oynar; geçişler sadece opacity/transform → kasmaz.
export function VideoSceneTour({ scenes }: { scenes: Scene[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
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
          const vid = videoRefs.current[i];
          const d = s - i;
          const op = clamp(1 - Math.abs(d), 0, 1);
          if (layer) {
            layer.style.opacity = op.toFixed(3);
            layer.style.visibility = op < 0.01 ? "hidden" : "visible";
          }
          if (vid) {
            const shouldPlay = op > 0.05;
            if (shouldPlay && vid.paused) vid.play().catch(() => {});
            else if (!shouldPlay && !vid.paused) vid.pause();
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

      // Scroll konumu + yumuşatma artık Lenis + ScrollTrigger'dan geliyor; kendi
      // rAF/lerp döngümüze gerek yok (ikinci yumuşatma sistemi → titreme demekti).
      // start/end, sticky iç viewport ile eski targetP() aralığını birebir verir.
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
            className="absolute inset-0"
            style={{ opacity: i === 0 ? 1 : 0, transform: "translateZ(0)", willChange: "opacity", backfaceVisibility: "hidden" }}
          >
            {sc.type === "video" ? (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                preload="auto"
                poster={sc.poster}
              >
                <source src={sc.src} type="video/mp4" />
              </video>
            ) : (
              <div className="kenburns h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${sc.src})` }} />
            )}
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/50" />

        {/* Üst bar */}
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
            className="absolute bottom-14 right-4 z-20 max-w-[82vw] text-right text-white sm:bottom-20 sm:right-10 sm:max-w-md"
            style={{ opacity: i === 0 ? 1 : 0, willChange: "transform, opacity" }}
          >
            {sc.kicker ? (
              <span className="ml-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-medium backdrop-blur sm:text-xs">
                <HardHat className="h-3.5 w-3.5" /> {sc.kicker}
              </span>
            ) : null}
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-cine sm:text-4xl md:text-5xl">{sc.title}</h2>
            {sc.text ? <p className="mt-2 text-sm text-white/85 text-cine sm:mt-3 sm:text-lg">{sc.text}</p> : null}
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

        <div ref={cueRef} className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-1 text-white/70">
          <span className="text-xs">aşağı kaydır</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
