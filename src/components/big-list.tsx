"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export type BigItem = { title: string; desc: string; image: string };

// Dev tipografili hizmet listesi: satıra gelince kelimenin arkasında görsel belirir.
export function BigList({ items }: { items: BigItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="border-t border-white/10">
      {items.map((it, i) => (
        <button
          key={it.title}
          type="button"
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
          className="group relative block w-full overflow-hidden border-b border-white/10 text-left"
        >
          {/* Arkada beliren görsel */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              backgroundImage: `url(${it.image})`,
              opacity: active === i ? 0.5 : 0,
              transform: active === i ? "scale(1.05)" : "scale(1.12)",
            }}
          />
          <div
            className="absolute inset-0 bg-black/40 transition-opacity duration-700"
            style={{ opacity: active === i ? 1 : 0 }}
          />
          <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-7 md:py-10">
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-white md:text-6xl">
                {it.title}
              </h3>
              <p className="mt-2 max-w-md text-sm text-white/70 md:text-base">
                {it.desc}
              </p>
            </div>
            <ArrowRight className="h-7 w-7 shrink-0 text-white/50 transition-transform duration-500 group-hover:translate-x-2 group-hover:text-white md:h-9 md:w-9" />
          </div>
        </button>
      ))}
    </div>
  );
}
