import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Images,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createCustomer, logoutAdmin } from "./actions";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { computeProgress, countDone } from "@/lib/tasks";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Yönetim", robots: { index: false } };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireAdmin();
  const q = (await searchParams).q?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { customerNo: { contains: q } },
            { phone: { contains: q } },
            { projectTitle: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { tasks: { select: { done: true } } },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Yönetim Paneli
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/vitrin">
              <Button variant="outline" size="sm">
                <Images className="h-4 w-4" /> Vitrin
              </Button>
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.username}
            </span>
            <form action={logoutAdmin}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" /> Çıkış
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Users className="h-6 w-6 text-primary" /> Müşteriler
            <Badge variant="muted">{customers.length}</Badge>
          </h1>
          <form className="flex gap-2" action="/admin">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="İsim, numara, telefon, araç…"
                className="w-56 pl-9"
              />
            </div>
            <Button variant="outline" type="submit">Ara</Button>
          </form>
        </div>

        {/* Yeni müşteri */}
        <Card>
          <CardContent>
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-2 font-medium">
                <Plus className="h-4 w-4 text-primary" /> Yeni Müşteri Ekle
              </summary>
              <form action={createCustomer} className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" name="phone" inputMode="tel" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projectTitle">Araç / İş</Label>
                  <Input id="projectTitle" name="projectTitle" placeholder="Örn. Chevrolet Cruze 2015 — debriyaj değişimi" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estimatedDelivery">Tahmini Teslim</Label>
                  <Input id="estimatedDelivery" name="estimatedDelivery" type="date" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input id="address" name="address" />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="addDefaults" defaultChecked className="h-4 w-4" />
                  Varsayılan iş listesini ekle (araç alındı, arıza tespiti, parça temin…) — sonra düzenlenebilir
                </label>
                <div className="sm:col-span-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4" /> Müşteri Oluştur
                  </Button>
                  <span className="ml-3 text-xs text-muted-foreground">
                    Müşteri numarası otomatik oluşturulur.
                  </span>
                </div>
              </form>
            </details>
          </CardContent>
        </Card>

        {/* Liste */}
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {q ? "Sonuç bulunamadı." : "Henüz müşteri yok. Yukarıdan ekleyin."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => {
              const progress = computeProgress(c.tasks);
              const done = countDone(c.tasks);
              return (
                <Link key={c.id} href={`/admin/musteri/${c.id}`}>
                  <Card className="transition hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{c.name}</span>
                          <Badge variant="muted">#{c.customerNo}</Badge>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {c.projectTitle || "—"}
                          {c.phone ? ` · ${c.phone}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <div className="hidden w-36 sm:block">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{done}/{c.tasks.length} iş</span>
                            <span>%{progress}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Teslim: {formatDate(c.estimatedDelivery)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
