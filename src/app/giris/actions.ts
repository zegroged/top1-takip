"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";
import { setCustomerSession } from "@/lib/session";

export type LoginState = { error?: string };

export async function loginCustomer(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const no = String(formData.get("customerNo") ?? "").trim();
  if (!no) return { error: "Lütfen müşteri numaranızı girin." };

  // Numara tahmin saldırılarını yavaşlat: IP başına dakikada 8 deneme.
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`clogin:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return { error: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." };
  }

  const customer = await prisma.customer.findUnique({
    where: { customerNo: no },
    select: { id: true, customerNo: true },
  });
  if (!customer) {
    return { error: "Bu müşteri numarası bulunamadı. Lütfen kontrol edin." };
  }

  await setCustomerSession({
    customerId: customer.id,
    customerNo: customer.customerNo,
  });
  redirect("/takip");
}
