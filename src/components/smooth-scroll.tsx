"use client";

import type { ReactNode } from "react";

// Lenis KALDIRILDI.
// Lenis iki ayrı kritik soruna yol açtı: (1) masaüstünde fare tekerleğini ele geçirip
// kaydırmayı durduruyordu (yalnız scrollbar çalışıyordu), (2) mobilde dokunmatik
// kaydırmayı kilitliyordu. Artık NATIVE scroll kullanıyoruz; GSAP ScrollTrigger native
// scroll ile sorunsuz çalışır (scrub yumuşatması ScrollTrigger'ın `scrub` ayarından gelir).
// Bileşen layout import'unu kırmamak için duruyor; sadece children'ı geçiriyor.
export function SmoothScroll({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
