"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";
import {
  clearAdminSession,
  requireAdmin,
  setAdminSession,
} from "@/lib/session";
import { generateCustomerNo } from "@/lib/customer-no";
import { saveImage } from "@/lib/uploads";
import { TASK_SUGGESTIONS } from "@/lib/tasks";

export type AdminAuthState = { error?: string };

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

function files(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((f): f is File => f instanceof File && f.size > 0);
}

// ---------- Kurulum (ilk admin) ----------
export async function setupAdmin(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  if ((await prisma.admin.count()) > 0)
    return { error: "Admin zaten mevcut. Lütfen giriş yapın." };

  const username = str(formData.get("username"));
  const password = str(formData.get("password"));
  if (username.length < 3) return { error: "Kullanıcı adı en az 3 karakter olmalı." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };

  const admin = await prisma.admin.create({
    data: { username, passwordHash: await bcrypt.hash(password, 10) },
  });
  await setAdminSession({ adminId: admin.id, username: admin.username });
  redirect("/admin");
}

// ---------- Giriş ----------
export async function loginAdmin(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`alogin:${ip}`, 5, 60_000).ok)
    return { error: "Çok fazla deneme. Lütfen biraz sonra deneyin." };

  const username = str(formData.get("username"));
  const password = str(formData.get("password"));
  if (!username || !password) return { error: "Kullanıcı adı ve şifre gerekli." };

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash)))
    return { error: "Kullanıcı adı veya şifre hatalı." };

  await setAdminSession({ adminId: admin.id, username: admin.username });
  redirect("/admin");
}

// ---------- Çıkış ----------
export async function logoutAdmin(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/giris");
}

// ---------- Müşteri oluştur ----------
export async function createCustomer(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = str(formData.get("name"));
  if (!name) return;

  const customer = await prisma.customer.create({
    data: {
      customerNo: await generateCustomerNo(),
      name,
      phone: str(formData.get("phone")) || null,
      address: str(formData.get("address")) || null,
      projectTitle: str(formData.get("projectTitle")) || null,
      description: str(formData.get("description")) || null,
      startDate: parseDate(formData.get("startDate")),
      estimatedDelivery: parseDate(formData.get("estimatedDelivery")),
    },
  });

  // İstenirse varsayılan iş listesini ekle.
  if (str(formData.get("addDefaults")) === "on") {
    await prisma.task.createMany({
      data: TASK_SUGGESTIONS.map((title, i) => ({
        customerId: customer.id,
        title,
        order: i,
      })),
    });
  }

  redirect(`/admin/musteri/${customer.id}`);
}

// ---------- Müşteri bilgilerini güncelle ----------
export async function updateCustomer(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.customer.update({
    where: { id },
    data: {
      name: str(formData.get("name")),
      phone: str(formData.get("phone")) || null,
      address: str(formData.get("address")) || null,
      projectTitle: str(formData.get("projectTitle")) || null,
      description: str(formData.get("description")) || null,
      startDate: parseDate(formData.get("startDate")),
      estimatedDelivery: parseDate(formData.get("estimatedDelivery")),
    },
  });
  revalidatePath(`/admin/musteri/${id}`);
}

// ---------- İş kalemi (task) ----------
export async function addTask(formData: FormData): Promise<void> {
  await requireAdmin();
  const customerId = str(formData.get("customerId"));
  const title = str(formData.get("title"));
  if (!customerId || !title) return;
  const last = await prisma.task.findFirst({
    where: { customerId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.task.create({
    data: { customerId, title, order: (last?.order ?? -1) + 1 },
  });
  revalidatePath(`/admin/musteri/${customerId}`);
}

export async function addDefaultTasks(formData: FormData): Promise<void> {
  await requireAdmin();
  const customerId = str(formData.get("customerId"));
  if (!customerId) return;
  const last = await prisma.task.findFirst({
    where: { customerId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const base = (last?.order ?? -1) + 1;
  await prisma.task.createMany({
    data: TASK_SUGGESTIONS.map((title, i) => ({
      customerId,
      title,
      order: base + i,
    })),
  });
  revalidatePath(`/admin/musteri/${customerId}`);
}

export async function toggleTask(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const customerId = str(formData.get("customerId"));
  if (!id) return;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({
    where: { id },
    data: { done: !task.done, doneAt: !task.done ? new Date() : null },
  });
  revalidatePath(`/admin/musteri/${customerId}`);
}

export async function moveTask(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const customerId = str(formData.get("customerId"));
  const dir = str(formData.get("dir")); // "up" | "down"
  if (!id || !customerId) return;
  const current = await prisma.task.findUnique({ where: { id } });
  if (!current) return;
  const neighbor = await prisma.task.findFirst({
    where:
      dir === "up"
        ? { customerId, order: { lt: current.order } }
        : { customerId, order: { gt: current.order } },
    orderBy: { order: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.task.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.task.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);
  revalidatePath(`/admin/musteri/${customerId}`);
}

export async function deleteTask(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const customerId = str(formData.get("customerId"));
  if (!id) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath(`/admin/musteri/${customerId}`);
}

// ---------- Günlük güncelleme + fotoğraf ----------
export async function addUpdate(formData: FormData): Promise<void> {
  await requireAdmin();
  const customerId = str(formData.get("customerId"));
  if (!customerId) return;
  const taskId = str(formData.get("taskId")) || null;

  const update = await prisma.progressUpdate.create({
    data: {
      customerId,
      taskId,
      title: str(formData.get("title")) || null,
      note: str(formData.get("note")) || null,
      date: parseDate(formData.get("date")) ?? new Date(),
    },
  });

  for (const file of files(formData, "photos")) {
    const filename = await saveImage(file);
    await prisma.photo.create({ data: { customerId, updateId: update.id, filename } });
  }

  revalidatePath(`/admin/musteri/${customerId}`);
}

export async function deleteUpdate(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const customerId = str(formData.get("customerId"));
  if (!id) return;
  await prisma.progressUpdate.delete({ where: { id } });
  revalidatePath(`/admin/musteri/${customerId}`);
}

export async function deletePhoto(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const customerId = str(formData.get("customerId"));
  if (!id) return;
  await prisma.photo.delete({ where: { id } });
  revalidatePath(`/admin/musteri/${customerId}`);
}

export async function deleteCustomer(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.customer.delete({ where: { id } });
  redirect("/admin");
}

// ---------- Vitrin / Galeri ----------
export async function addShowcase(formData: FormData): Promise<void> {
  await requireAdmin();
  const title = str(formData.get("title")) || null;
  const photos = files(formData, "photos");
  if (photos.length === 0) return;
  const last = await prisma.showcaseItem.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let order = (last?.order ?? -1) + 1;
  for (const file of photos) {
    const filename = await saveImage(file);
    await prisma.showcaseItem.create({ data: { title, filename, order } });
    order += 1;
  }
  revalidatePath("/admin/vitrin");
  revalidatePath("/");
}

export async function deleteShowcase(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.showcaseItem.delete({ where: { id } });
  revalidatePath("/admin/vitrin");
  revalidatePath("/");
}

export async function moveShowcase(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const dir = str(formData.get("dir"));
  if (!id) return;
  const current = await prisma.showcaseItem.findUnique({ where: { id } });
  if (!current) return;
  const neighbor = await prisma.showcaseItem.findFirst({
    where: dir === "up" ? { order: { lt: current.order } } : { order: { gt: current.order } },
    orderBy: { order: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.showcaseItem.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.showcaseItem.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);
  revalidatePath("/admin/vitrin");
  revalidatePath("/");
}
