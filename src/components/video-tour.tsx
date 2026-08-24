"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, HardHat, MessageCircle, Phone } from "lucide-react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui";
import { COMPANY } from "@/lib/constants";

export type Beat = { kicker?: string; title: string; text?: string; final?: boolean };

// Tam ekran akıcı oynayan sinematik video (scrub YOK → kasmaz).
// Scroll ettikçe sağ alttan yazılar gelir (lerp yumuşatma).
export function VideoTour({
  src,
  poster,
  beats,
}: {
  src: string;
  poster: string;
  beats: Beat[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const capRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cueRef = useRef<HTMLDivElement>(null);
  const N = beats.length;
  const SCENE_VH = 85;

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;
      const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

      const render = (p: number) => {
        const s = p * (N - 1);
        for (let i = 0; i < N; i++) {
          const cap = capRefs.current[i];
          if (!cap) continue;
          const d = s - i;
          const op = clamp(1 - Math.abs(d) / 0.5, 0, 1);
          const off = (clamp(-d, 0, 1) * 46).toFixed(0);
          cap.style.opacity = op.toFixed(3);
          cap.style.transform = `translate3d(${off}px, ${off}px, 0)`;
          cap.style.visibility = op < 0.01 ? "hidden" : "visible";
        }
        if (cueRef.current) cueRef.current.style.opacity = clamp(1 - s / 0.3, 0, 1).toFixed(3);
      };

      // Video kendi akıcı oynar; yazı geçişlerini Lenis + ScrollTrigger sürer.
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
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
        >
          <source src={src} type="video/mp4" />
        </video>
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
        {beats.map((b, i) => (
          <div
            key={i}
            ref={(el) => {
              capRefs.current[i] = el;
            }}
            className="absolute bottom-16 right-5 z-20 max-w-md text-right text-white sm:bottom-20 sm:right-10"
            style={{ opacity: i === 0 ? 1 : 0, willChange: "transform, opacity" }}
          >
            {b.kicker ? (
              <span className="ml-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <HardHat className="h-3.5 w-3.5" /> {b.kicker}
              </span>
            ) : null}
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-cine sm:text-5xl">{b.title}</h2>
            {b.text ? <p className="mt-3 text-base text-white/85 text-cine sm:text-lg">{b.text}</p> : null}
            {b.final ? (
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
