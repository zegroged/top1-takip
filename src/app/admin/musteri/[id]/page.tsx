import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  ImagePlus,
  ListPlus,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  addDefaultTasks,
  addTask,
  addUpdate,
  deleteCustomer,
  deletePhoto,
  deleteTask,
  deleteUpdate,
  moveTask,
  toggleTask,
  updateCustomer,
} from "../../actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { TASK_SUGGESTIONS, computeProgress, countDone } from "@/lib/tasks";
import { formatDate, photoUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Müşteri", robots: { index: false } };

function dateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

const selectCls =
  "h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 text-sm";

export default async function MusteriDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { order: "asc" } },
      updates: {
        orderBy: { date: "desc" },
        include: { photos: true, task: { select: { title: true } } },
      },
    },
  });
  if (!customer) notFound();

  const progress = computeProgress(customer.tasks);
  const done = countDone(customer.tasks);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Müşteriler
          </Link>
          <form action={deleteCustomer}>
            <input type="hidden" name="id" value={customer.id} />
            <ConfirmSubmit
              variant="ghost"
              size="sm"
              message={`"${customer.name}" müşterisi ve tüm kayıtları silinecek. Emin misiniz?`}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Müşteriyi Sil
            </ConfirmSubmit>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {customer.projectTitle || "Araç/iş bilgisi yok"} · {done}/{customer.tasks.length} iş (%{progress})
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Müşteri Numarası</p>
            <p className="font-mono text-xl font-semibold tracking-widest text-primary">
              {customer.customerNo}
            </p>
          </div>
        </div>

        {/* İş listesi */}
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Yapılacaklar Listesi</h2>
              {customer.tasks.length === 0 ? (
                <form action={addDefaultTasks}>
                  <input type="hidden" name="customerId" value={customer.id} />
                  <Button type="submit" variant="outline" size="sm">
                    <ListPlus className="h-4 w-4" /> Varsayılan listeyi ekle
                  </Button>
                </form>
              ) : null}
            </div>

            {customer.tasks.length > 0 ? (
              <ul className="mb-5 space-y-2">
                {customer.tasks.map((task, i) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <form action={toggleTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="customerId" value={customer.id} />
                      <button
                        type="submit"
                        title={task.done ? "Geri al" : "Tamamlandı işaretle"}
                        className={
                          "grid h-6 w-6 place-items-center rounded-full border-2 " +
                          (task.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary")
                        }
                      >
                        {task.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
                      </button>
                    </form>
                    <span className={"flex-1 text-sm " + (task.done ? "text-muted-foreground line-through" : "font-medium")}>
                      {task.title}
                    </span>
                    <form action={moveTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="customerId" value={customer.id} />
                      <input type="hidden" name="dir" value="up" />
                      <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={i === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </form>
                    <form action={moveTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="customerId" value={customer.id} />
                      <input type="hidden" name="dir" value="down" />
                      <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={i === customer.tasks.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </form>
                    <form action={deleteTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="customerId" value={customer.id} />
                      <ConfirmSubmit variant="ghost" size="sm" message="İş silinsin mi?" className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </ConfirmSubmit>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* İş ekle */}
            <form action={addTask} className="flex gap-2">
              <input type="hidden" name="customerId" value={customer.id} />
              <Input name="title" placeholder="Yeni iş kalemi (örn. Balata değişimi)" required />
              <Button type="submit"><Plus className="h-4 w-4" /> Ekle</Button>
            </form>

            {/* Hızlı öneri çipleri */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TASK_SUGGESTIONS.map((s) => (
                <form key={s} action={addTask}>
                  <input type="hidden" name="customerId" value={customer.id} />
                  <input type="hidden" name="title" value={s} />
                  <button
                    type="submit"
                    className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                  >
                    + {s}
                  </button>
                </form>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bilgiler */}
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Bilgiler</h2>
            <form action={updateCustomer} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={customer.id} />
              <div className="space-y-1.5">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input id="name" name="name" defaultValue={customer.name} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" defaultValue={customer.phone ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="projectTitle">Araç / İş</Label>
                <Input id="projectTitle" name="projectTitle" defaultValue={customer.projectTitle ?? ""} placeholder="Örn. Chevrolet Cruze 2015 — debriyaj" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={dateInput(customer.startDate)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimatedDelivery">Tahmini Teslim</Label>
                <Input id="estimatedDelivery" name="estimatedDelivery" type="date" defaultValue={dateInput(customer.estimatedDelivery)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" name="address" defaultValue={customer.address ?? ""} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Açıklama / Not</Label>
                <Textarea id="description" name="description" defaultValue={customer.description ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit"><Save className="h-4 w-4" /> Kaydet</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Günlük güncelleme ekle */}
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Günlük Güncelleme / Fotoğraf Ekle</h2>
            <form action={addUpdate} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="customerId" value={customer.id} />
              <div className="space-y-1.5">
                <Label htmlFor="date">Tarih</Label>
                <Input id="date" name="date" type="date" defaultValue={dateInput(new Date())} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taskId">İlgili İş (opsiyonel)</Label>
                <select id="taskId" name="taskId" defaultValue="" className={selectCls}>
                  <option value="">—</option>
                  {customer.tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Başlık</Label>
                <Input id="title" name="title" placeholder="Örn. Debriyaj takıldı, yol testi yapıldı" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="note">Not</Label>
                <Textarea id="note" name="note" placeholder="Müşteriye gösterilecek açıklama…" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="photos">Fotoğraflar</Label>
                <Input
                  id="photos"
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit"><ImagePlus className="h-4 w-4" /> Güncelleme Ekle</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Geçmiş */}
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Güncelleme Geçmişi ({customer.updates.length})</h2>
            {customer.updates.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">Henüz güncelleme yok.</p>
            ) : (
              <div className="space-y-5">
                {customer.updates.map((u) => (
                  <div key={u.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-sm font-medium">
                            <CalendarClock className="h-3.5 w-3.5 text-primary" />
                            {formatDate(u.date)}
                          </span>
                          {u.task?.title ? <Badge variant="muted">{u.task.title}</Badge> : null}
                        </div>
                        {u.title ? <p className="mt-2 font-medium">{u.title}</p> : null}
                        {u.note ? <p className="mt-1 text-sm text-muted-foreground">{u.note}</p> : null}
                      </div>
                      <form action={deleteUpdate}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="customerId" value={customer.id} />
                        <ConfirmSubmit variant="ghost" size="sm" message="Bu güncelleme ve fotoğrafları silinecek. Emin misiniz?" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </ConfirmSubmit>
                      </form>
                    </div>

                    {u.photos.length > 0 ? (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {u.photos.map((p) => (
                          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                            <a href={photoUrl(p.filename)} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photoUrl(p.filename)} alt="Fotoğraf" className="h-full w-full object-cover" loading="lazy" />
                            </a>
                            <form action={deletePhoto} className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100">
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="customerId" value={customer.id} />
                              <ConfirmSubmit variant="destructive" size="sm" message="Fotoğraf silinsin mi?" className="h-7 w-7 p-0">
                                <Trash2 className="h-3.5 w-3.5" />
                              </ConfirmSubmit>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
