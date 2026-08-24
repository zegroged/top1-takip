"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

// Scroll'a göre yumuşak parallax (katman farklı hızda kayar → derinlik).
// GSAP ScrollTrigger scrub ile transform sürülür; yumuşatmayı Lenis sağlar.
// Function-based değerler + invalidateOnRefresh → resize'da yeniden hesaplanır.
export function Parallax({
  speed = 0.2,
  className,
  children,
}: {
  speed?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const shift = () => window.innerHeight * speed * 0.5;
      gsap.fromTo(
        el,
        { y: shift },
        {
          y: () => -shift(),
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [speed] },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
