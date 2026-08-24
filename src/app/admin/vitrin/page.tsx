import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { addShowcase, deleteShowcase, moveShowcase } from "../actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Button, Card, CardContent, Input, Label } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { photoUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Vitrin", robots: { index: false } };

export default async function VitrinPage() {
  await requireAdmin();
  const items = await prisma.showcaseItem.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-5">
          <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Yönetim
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Vitrin / Yaptığımız İşler</h1>
        <p className="-mt-3 text-sm text-muted-foreground">
          Buraya eklediğiniz fotoğraflar ana sayfadaki galeride görünür.
        </p>

        {/* Yükle */}
        <Card>
          <CardContent>
            <form action={addShowcase} className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Başlık (opsiyonel)</Label>
                <Input id="title" name="title" placeholder="Örn. Cruze motor revizyonu" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="photos">Fotoğraflar</Label>
                <Input
                  id="photos"
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  className="h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
                />
              </div>
              <div>
                <Button type="submit"><ImagePlus className="h-4 w-4" /> Vitrine Ekle</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Galeri */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Henüz vitrin fotoğrafı yok.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item, i) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(item.filename)} alt={item.title ?? "Vitrin"} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <span className="truncate text-xs text-muted-foreground">{item.title || "—"}</span>
                  <div className="flex items-center">
                    <form action={moveShowcase}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="dir" value="up" />
                      <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={i === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </form>
                    <form action={moveShowcase}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="dir" value="down" />
                      <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={i === items.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </form>
                    <form action={deleteShowcase}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmSubmit variant="ghost" size="sm" message="Fotoğraf vitrinden silinsin mi?" className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
