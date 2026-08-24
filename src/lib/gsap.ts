// Merkezi GSAP konfigürasyonu.
// Eklentiler SADECE istemcide ve bir kez kaydedilir (her bileşende ayrı ayrı
// registerPlugin çağırmak anti-paterndir → çift kayıt / SSR hataları).
// Tüm proje GSAP'ı buradan import eder: import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// ES modülü tek sefer yüklenir; registerPlugin idempotenttir. window guard'ı
// SSR sırasında (use client modülleri sunucuda da değerlendirilir) gereksiz kaydı önler.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Mobilde adres çubuğu açılıp kapandıkça viewport yüksekliği değişir; bu, pinned
  // scroll-scrub'ı zıplatır. ignoreMobileResize: küçük dikey resize'larda ScrollTrigger'ı
  // YENİLEME → mobil scroll masaüstüne yakın, sıçramasız hisseder.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };
