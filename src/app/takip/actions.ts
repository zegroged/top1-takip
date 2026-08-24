"use server";

import { redirect } from "next/navigation";
import { clearCustomerSession } from "@/lib/session";

export async function logoutCustomer(): Promise<void> {
  await clearCustomerSession();
  redirect("/giris");
}
