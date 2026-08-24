import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminAuthForm } from "./auth-form";
import { Card, CardContent } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin Girişi", robots: { index: false } };

export default async function AdminGirisPage() {
  if (await getAdminSession()) redirect("/admin");
  const count = await prisma.admin.count();
  const mode = count === 0 ? "setup" : "login";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-5 py-16">
      <div className="mb-6 flex items-center gap-2 font-semibold">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background">
          <ShieldCheck className="h-4.5 w-4.5" />
        </span>
        Yönetim Paneli
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <h1 className="text-xl font-semibold tracking-tight">
            {mode === "setup" ? "İlk Admin Kurulumu" : "Admin Girişi"}
          </h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            {mode === "setup"
              ? "Henüz admin yok. İlk yönetici hesabını oluşturun."
              : "Devam etmek için giriş yapın."}
          </p>
          <AdminAuthForm mode={mode} />
        </CardContent>
      </Card>
    </main>
  );
}
