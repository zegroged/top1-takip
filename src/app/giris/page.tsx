import Link from "next/link";
import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { Card, CardContent } from "@/components/ui";
import { COMPANY } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";

export const metadata: Metadata = { title: "Müşteri Girişi" };

export default async function GirisPage() {
  // Zaten giriş yapmış VE müşteri kaydı hâlâ varsa panele yönlendir. (Silinmiş müşteriye ait
  // eski çerez varsa /takip'e yönlendirip döngüye girmemek için DB'de varlığı doğrulanır.)
  const session = await getCustomerSession();
  if (session) {
    const exists = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true },
    });
    if (exists) redirect("/takip");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-5 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="h-5 w-5" />
        </span>
        {COMPANY.name}
      </Link>

      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <h1 className="text-xl font-semibold tracking-tight">Müşteri Girişi</h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Aracınızın servis durumunu takip etmek için müşteri numaranızı girin.
          </p>
          <LoginForm />
        </CardContent>
      </Card>

      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Ana sayfaya dön
      </Link>
    </main>
  );
}
