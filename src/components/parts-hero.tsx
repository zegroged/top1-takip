"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, MessageCircle, Phone, Wrench } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui";
import { COMPANY } from "@/lib/constants";

// Hero, cihaza göre iki AYRI mod (tek <video> öğesi, kaynak/fit cihaza göre):
// - MASAÜSTÜ (lg+): scroll-scrub. /cruze.mp4 (all-keyframe) video.currentTime ile kaydırınca söküm.
//   (DOKUNULMADI — kusursuz.)
// - MOBİL (<lg): DOKUN-ile-sahne. Scroll YOK. Her dokunuşta video, mevcut sahneden bir sonraki
//   "dağılış" sahnesine DONANIM HIZLANDIRMALI OYNATILIR (seek değil → akıcı 24fps+), sonra durur.
//   /cruze-play.mp4 (hafif, normal GOP) + object-contain (parçalar kırpılmaz).
const FRAME_COUNT = 60;
// "Durak" kareleri = parçaların DAĞILDIĞI dramatik anlar (6fps'lik karelerden seçildi):
// f000 bütün araba · f018 ön (tampon/far/ızgara) dağılıyor · f042 fren-süspansiyon patlıyor · f055 tam exploded.
const SCENES = [0, 18, 42, 55];
const PLAYBACK_RATE = 1.6; // sahne geçiş hızı (düşük = daha yavaş). Akıcı (donanım oynatma).

export function PartsHero() {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapRef = useRef<HTMLButtonElement>(null);
  const beatRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const hintRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      const video = videoRef.current;
      if (!track || !video) return;
      const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.innerWidth < 1024;

      // ============================ MOBİL: DOKUN-ile-sahne (video oynatma) ============================
      if (isMobile) {
        const tap = tapRef.current;
        if (!tap) return;
        video.src = "/cruze-play.mp4";
        video.muted = true;
        video.playsInline = true;
        video.style.objectFit = "contain";
        video.load();

        const sceneFracs = SCENES.map((f) => f / FRAME_COUNT); // [0, 0.30, 0.70, 0.9167]
        let sceneTimes: number[] = [];
        let sceneIndex = 0;
        let rafId = 0;
        const computeTimes = () => {
          const d = video.duration && isFinite(video.duration) ? video.duration : 10;
          sceneTimes = sceneFracs.map((fr) => Math.min(fr * d, d - 0.05));
        };
        const onMeta = () => {
          computeTimes();
          try {
            video.currentTime = sceneTimes[0];
          } catch {}
        };
        video.addEventListener("loadedmetadata", onMeta);

        // Mevcut sahneden hedef sahneye DÜZ OYNAT (akıcı), hedefte durdur.
        const playToScene = (k: number) => {
          if (!sceneTimes.length) computeTimes();
          const target = sceneTimes[k];
          cancelAnimationFrame(rafId);
          video.playbackRate = reduce ? 16 : PLAYBACK_RATE;
          const pr = video.play();
          if (pr && pr.catch) pr.catch(() => {});
          const check = () => {
            if (video.paused || video.currentTime >= target) {
              video.pause();
              if (video.currentTime > target + 0.02) {
                try {
                  video.currentTime = target;
                } catch {}
              }
              return;
            }
            rafId = requestAnimationFrame(check);
          };
          rafId = requestAnimationFrame(check);
        };

        const showBeat = (idx: number) => {
          beatRefs.current.forEach((el, i) => {
            if (!el) return;
            gsap.to(el, {
              autoAlpha: i === idx ? 1 : 0,
              y: i === idx ? 0 : 12,
              duration: reduce ? 0 : 0.45,
              ease: "power2.out",
            });
          });
        };
        const updateDots = (idx: number) => {
          dotRefs.current.forEach((d, i) => {
            if (!d) return;
            d.style.width = i === idx ? "22px" : "7px";
            d.style.opacity = i === idx ? "1" : "0.4";
          });
        };
        const onTap = () => {
          if (sceneIndex < SCENES.length - 1) {
            sceneIndex += 1;
            showBeat(sceneIndex);
            updateDots(sceneIndex);
            if (hintRef.current) gsap.to(hintRef.current, { autoAlpha: 0, duration: 0.3 });
            playToScene(sceneIndex);
          } else {
            document.getElementById("kategoriler")?.scrollIntoView({ behavior: "smooth" });
          }
        };
        tap.addEventListener("click", onTap);

        // İlk durum: sahne 0, beat 0 görünür, nokta 0 aktif.
        beatRefs.current.forEach((el, i) => {
          if (el) gsap.set(el, { autoAlpha: i === 0 ? 1 : 0, y: 0 });
        });
        updateDots(0);

        return () => {
          cancelAnimationFrame(rafId);
          video.removeEventListener("loadedmetadata", onMeta);
          tap.removeEventListener("click", onTap);
        };
      }

      // ============================ MASAÜSTÜ: scroll-scrub (DOKUNULMADI) ============================
      video.src = "/cruze.mp4";
      video.style.objectFit = "cover";
      video.load();
      video.pause();
      let duration = video.readyState >= 1 ? video.duration || 0 : 0;
      const onMeta = () => {
        duration = video.duration || 0;
      };
      video.addEventListener("loadedmetadata", onMeta);

      const windows: [number, number][] = [
        [0.0, 0.16],
        [0.3, 0.5],
        [0.54, 0.76],
        [0.82, 1.001],
      ];
      const F = 0.06;
      const beatOpacity = (p: number, [a, b]: [number, number]) =>
        clamp(Math.min((p - a) / F, (b - p) / F, 1), 0, 1);

      // Sadece beat yazıları + cue (video'ya dokunmaz — video idle'da kendi oynar, scrub'da scroll sürer).
      const updateBeats = (p: number) => {
        windows.forEach((w, i) => {
          const el = beatRefs.current[i];
          if (!el) return;
          const o = beatOpacity(p, w);
          el.style.opacity = o.toFixed(3);
          el.style.transform = `translateY(${((1 - o) * 18).toFixed(1)}px)`;
          el.style.visibility = o < 0.01 ? "hidden" : "visible";
        });
        if (cueRef.current) cueRef.current.style.opacity = clamp(1 - p / 0.08, 0, 1).toFixed(3);
      };

      if (reduce) {
        track.style.height = "100svh";
        beatRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.opacity = i === 3 ? "1" : "0";
          el.style.transform = "none";
          el.style.visibility = i === 3 ? "visible" : "hidden";
        });
        if (cueRef.current) cueRef.current.style.opacity = "0";
        return () => video.removeEventListener("loadedmetadata", onMeta);
      }

      // İKİ MOD:
      // - IDLE (kaydırmıyor): video YAVAŞ OYNAR (donanım, akıcı). Yavaş scrub kasıyordu çünkü
      //   24fps kaynağı yavaş sarınca ~3fps görünür; oynatma akıcı (12fps hissi).
      // - SCRUB (kaydırıyor): video durur, currentTime'ı scroll deltası sürer (hızlı = akıcı, iki yön).
      // Beat'ler her durumda video konumunu takip eder.
      const IDLE_RATE = 0.8; // idle oynatma hızı. Kaynak 120fps → 0.8x = 96fps (yüksek-yenileme ekran için akıcı).
      let lastY = window.scrollY;
      let accum = 0; // birikmiş scroll (px, işaretli)
      let lastScrollAt = -1;
      let mode: "idle" | "scrub" = "scrub";
      let gain = 1 / 3000;
      const computeGain = () => {
        const total = track.offsetHeight - window.innerHeight;
        gain = total > 0 ? 1 / total : 1 / 3000;
      };
      computeGain();
      const onScroll = () => {
        const y = window.scrollY;
        accum += y - lastY;
        lastY = y;
        lastScrollAt = performance.now();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", computeGain);
      video.muted = true;
      video.playsInline = true;

      const tick = () => {
        if (duration <= 0) return;
        const idle = lastScrollAt < 0 || performance.now() - lastScrollAt > 140;
        if (idle) {
          if (mode !== "idle") {
            mode = "idle";
            video.playbackRate = IDLE_RATE;
          }
          if (video.paused && !video.ended) video.play().catch(() => {});
        } else {
          if (mode !== "scrub") {
            mode = "scrub";
            video.pause();
          }
          if (accum !== 0) {
            video.currentTime = clamp(
              video.currentTime + accum * gain * (duration - 0.05),
              0,
              duration - 0.05,
            );
            accum = 0;
          }
        }
        updateBeats(clamp(video.currentTime / (duration - 0.05), 0, 1));
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", computeGain);
        video.removeEventListener("loadedmetadata", onMeta);
        video.pause();
      };
    },
    { scope: trackRef },
  );

  return (
    <section ref={trackRef} className="relative h-[100svh] lg:h-[480vh]">
      <div className="relative h-[100svh] w-full overflow-hidden bg-[#0b0c0f] lg:sticky lg:top-0">
        {/* Tek video — masaüstü: cover+scrub /cruze.mp4 · mobil: contain+oynat /cruze-play.mp4 (kaynak/fit JS'te) */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          poster="/cruze-poster.jpg"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/55" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-background" />

        {/* MOBİL dokunma katmanı — ekrana dokununca sonraki sahne (yalnız <lg). Yazı/butonların altında. */}
        <button
          ref={tapRef}
          type="button"
          aria-label="Sonraki sahne"
          className="absolute inset-0 z-10 cursor-pointer lg:hidden"
        />

        {/* Üst bar */}
        <div className="absolute inset-x-0 top-0 z-30">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/25 bg-white/10 backdrop-blur">
                <Wrench className="h-5 w-5 text-primary" />
              </span>
              <span className="text-base font-semibold tracking-wide sm:text-lg">{COMPANY.short}</span>
            </div>
            <Link href="/giris">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20">
                Müşteri Girişi
              </Button>
            </Link>
          </div>
        </div>

        {/* Beat yazıları — masaüstü + mobil ortak. pointer-events-none → mobilde dokunuş alttaki
            katmana geçer; sadece butonlar/linkler tıklanabilir. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
            <div className="relative min-h-[250px] sm:min-h-[280px]">
              <div ref={(el) => { beatRefs.current[0] = el; }} className="absolute bottom-0 left-0 max-w-2xl text-white" style={{ willChange: "opacity, transform" }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  <Wrench className="h-3.5 w-3.5 text-primary" /> Oto Yedek Parça
                </span>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-cine sm:text-6xl">
                  Aracınızın her parçası, <span className="text-primary">tek adreste</span>.
                </h1>
                <p className="mt-4 max-w-xl text-base text-white/80 text-cine sm:text-lg">
                  Motordan frene, kaportadan elektriğe — tüm markalar için orijinal ve eşdeğer parça, hızlı temin.
                </p>
              </div>

              <div ref={(el) => { beatRefs.current[1] = el; }} className="absolute bottom-0 left-0 max-w-xl text-white" style={{ opacity: 0, willChange: "opacity, transform" }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary backdrop-blur">Kaporta & Dış Donanım</span>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-cine sm:text-5xl">Tampondan kaputa, her parça.</h2>
                <p className="mt-3 max-w-md text-base text-white/80 text-cine sm:text-lg">Tampon, far, kaput, çamurluk, ızgara, ayna — orijinal kalıbında.</p>
              </div>

              <div ref={(el) => { beatRefs.current[2] = el; }} className="absolute bottom-0 left-0 max-w-xl text-white" style={{ opacity: 0, willChange: "opacity, transform" }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary backdrop-blur">Fren & Süspansiyon</span>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-cine sm:text-5xl">Güvenlik, doğru parçayla başlar.</h2>
                <p className="mt-3 max-w-md text-base text-white/80 text-cine sm:text-lg">Disk, balata, kaliper, amortisör, rotil — kontrolü bize bırakın.</p>
              </div>

              <div ref={(el) => { beatRefs.current[3] = el; }} className="absolute bottom-0 left-0 max-w-2xl text-white" style={{ opacity: 0, willChange: "opacity, transform" }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">Tüm Marka • Tüm Parça</span>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-cine sm:text-5xl">Parçası bizde, <span className="text-primary">takibi sizde</span>.</h2>
                <p className="mt-3 max-w-lg text-base text-white/80 text-cine sm:text-lg">Servise bıraktığınız aracın durumunu, fotoğraflarıyla kendi panelinizden canlı izleyin.</p>
                <div className="pointer-events-auto mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/giris" className="w-full sm:w-auto"><Button size="lg" className="w-full sm:w-auto">Müşteri Girişi <ArrowRight className="h-4 w-4" /></Button></Link>
                  <a href={COMPANY.phoneHref} className="flex items-center gap-2 text-white/90 hover:text-white"><Phone className="h-4 w-4 text-primary" /> {COMPANY.phone}</a>
                  <a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/90 hover:text-white"><MessageCircle className="h-4 w-4 text-primary" /> WhatsApp</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBİL: dokun ipucu + sahne noktaları (yalnız <lg) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex flex-col items-center gap-2.5 lg:hidden">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                ref={(el) => { dotRefs.current[i] = el; }}
                className="h-1.5 rounded-full bg-white transition-[width,opacity] duration-300"
                style={{ width: i === 0 ? "22px" : "7px", opacity: i === 0 ? 1 : 0.4 }}
              />
            ))}
          </div>
          <span ref={hintRef} className="text-xs text-white/65">ilerlemek için ekrana dokun</span>
        </div>

        {/* MASAÜSTÜ: aşağı kaydır işareti (yalnız lg+) */}
        <div ref={cueRef} className="absolute inset-x-0 bottom-6 z-10 hidden flex-col items-center gap-1 text-white/55 lg:flex">
          <span className="text-xs">aşağı kaydır</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
