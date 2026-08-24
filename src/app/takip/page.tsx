import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  Check,
  Circle,
  ImageIcon,
  ListChecks,
  LogOut,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import { logoutCustomer } from "./actions";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { COMPANY } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/session";
import { computeProgress, countDone } from "@/lib/tasks";
import { formatDate, photoUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Servis Takibim" };

export default async function TakipPage() {
  const session = await requireCustomer();
  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    include: {
      tasks: { orderBy: { order: "asc" } },
      updates: {
        orderBy: { date: "desc" },
        include: { photos: true, task: { select: { title: true } } },
      },
    },
  });

  if (!customer) {
    // clearCustomerSession() render'da ÇAĞRILAMAZ (Next 15: çerez yalnız Server Action / Route
    // Handler'da değiştirilebilir). Silinmiş müşteri çerezi → sadece yönlendir. /giris müşteri
    // var mı diye doğruladığından döngü olmaz; çerez sonraki girişte üzerine yazılır.
    redirect("/giris");
  }

  const progress = computeProgress(customer.tasks);
  const done = countDone(customer.tasks);
  const currentIdx = customer.tasks.findIndex((t) => !t.done);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Wrench className="h-4 w-4" />
            </span>
            {COMPANY.name}
          </Link>
          <form action={logoutCustomer}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" /> Çıkış
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        {/* Özet */}
        <Card>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Merhaba,</p>
                <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
                {customer.projectTitle ? (
                  <p className="mt-1 text-muted-foreground">{customer.projectTitle}</p>
                ) : null}
              </div>
              <Badge variant="primary">Müşteri No: {customer.customerNo}</Badge>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">
                  İlerleme: {done}/{customer.tasks.length} iş tamamlandı
                </span>
                <span className="text-muted-foreground">%{progress}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Tahmini Teslim Tarihi</p>
                  <p className="font-medium">{formatDate(customer.estimatedDelivery)}</p>
                </div>
              </div>
              {customer.address ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adres</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* İş listesi */}
        <Card>
          <CardContent>
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <ListChecks className="h-5 w-5 text-primary" /> Yapılacaklar
            </h2>
            {customer.tasks.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                İş listesi henüz hazırlanıyor.
              </p>
            ) : (
              <ol className="space-y-0">
                {customer.tasks.map((task, i) => {
                  const current = i === currentIdx;
                  const last = i === customer.tasks.length - 1;
                  return (
                    <li key={task.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={
                            "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 " +
                            (task.done
                              ? "border-primary bg-primary text-primary-foreground"
                              : current
                                ? "border-primary text-primary"
                                : "border-border text-muted-foreground")
                          }
                        >
                          {task.done ? <Check className="h-4 w-4" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
                        </span>
                        {!last ? <span className={"my-1 w-0.5 flex-1 " + (task.done ? "bg-primary" : "bg-border")} /> : null}
                      </div>
                      <div className={last ? "pb-0" : "pb-5"}>
                        <p className={"font-medium " + (current ? "text-primary" : task.done ? "" : "text-muted-foreground")}>
                          {task.title}
                          {current ? <Badge variant="primary" className="ml-2 align-middle">Şu an</Badge> : null}
                          {task.done ? <Badge variant="success" className="ml-2 align-middle">Tamam</Badge> : null}
                        </p>
                        {task.done && task.doneAt ? (
                          <p className="text-xs text-muted-foreground">{formatDate(task.doneAt)}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Günlük güncellemeler */}
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Gün Gün Takip</h2>
            {customer.updates.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p>Henüz güncelleme eklenmedi.</p>
                <p className="text-sm">Çalışmalar ilerledikçe fotoğraflar ve notlar burada görünecek.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {customer.updates.map((u) => (
                  <div key={u.id} className="border-l-2 border-border pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        {formatDate(u.date)}
                      </span>
                      {u.task?.title ? <Badge variant="muted">{u.task.title}</Badge> : null}
                    </div>
                    {u.title ? <p className="mt-1.5 font-medium">{u.title}</p> : null}
                    {u.note ? <p className="mt-1 text-sm text-muted-foreground">{u.note}</p> : null}
                    {u.photos.length > 0 ? (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {u.photos.map((p) => (
                          <a
                            key={p.id}
                            href={photoUrl(p.filename)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoUrl(p.filename)}
                              alt={p.caption ?? "Servis fotoğrafı"}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 pb-4 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" /> Sorularınız için: {COMPANY.phone}
        </div>
      </main>
    </div>
  );
}
