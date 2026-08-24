"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

// Scroll'a bağlı video: sayfa aşağı kaydıkça video kare kare ilerler (scrub).
// Otomatik oynatma YOK; ilerlemeyi tamamen scroll konumu belirler.
export function ScrollHero({
  src,
  poster,
  children,
  trackHeight = "260vh",
}: {
  src: string;
  poster?: string;
  children: React.ReactNode;
  trackHeight?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const video = videoRef.current;
      if (!wrap || !video) return;

      video.pause();
      let duration = video.readyState >= 1 ? video.duration || 0 : 0;

      // Scroll ilerlemesini (Lenis-yumuşatmalı) video karesine çevir.
      const setFrame = (p: number) => {
        if (duration <= 0) return;
        const t = p * (duration - 0.05); // sona tam gitme → siyah kare riskini önle
        if (Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
      };

      // Metadata gelince süre netleşir; ScrollTrigger'ı tazele.
      const onMeta = () => {
        duration = video.duration || 0;
        ScrollTrigger.refresh();
      };
      video.addEventListener("loadedmetadata", onMeta);

      ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => setFrame(self.progress),
        onRefresh: (self) => setFrame(self.progress),
      });

      return () => video.removeEventListener("loadedmetadata", onMeta);
    },
    { scope: wrapRef },
  );

  return (
    <section ref={wrapRef} className="relative" style={{ height: trackHeight }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/80" />
        {/* Alt kenarda arka plana yumuşak geçiş */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-b from-transparent via-background/35 to-background" />
        <div className="relative z-10 flex h-full flex-col text-white">{children}</div>
      </div>
    </section>
  );
}
