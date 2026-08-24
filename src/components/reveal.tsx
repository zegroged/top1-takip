"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Scroll ile görünür olunca beliren sarmalayıcı.
// IntersectionObserver kullanır — GSAP ScrollTrigger DEĞİL. Çünkü ScrollTrigger,
// mobilde adres çubuğu açılıp kapandıkça viewport yüksekliği değiştiği için
// "görünür oldu" eşiğini şaşırıp tetiklenmeyebiliyordu → içerik opacity:0'da kalıyordu.
// IntersectionObserver bundan etkilenmez. Ayrıca 1.5sn fallback: ne olursa olsun göster.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion: hemen göster.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }

    // Güvenlik ağı: IO bir sebeple tetiklenmezse içerik gizli kalmasın.
    const fallback = window.setTimeout(() => el.classList.add("in"), 1500);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
            window.clearTimeout(fallback);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
