import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/smooth-scroll";
import { COMPANY, ROOT_DOMAIN } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${ROOT_DOMAIN}`),
  title: {
    default: `${COMPANY.name} — ${COMPANY.tagline}`,
    template: `%s · ${COMPANY.name}`,
  },
  description:
    "Tüm markalar için oto yedek parça: motor, fren, süspansiyon, kaporta ve elektrik. Servise bıraktığınız aracın onarımını canlı takip edin.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
