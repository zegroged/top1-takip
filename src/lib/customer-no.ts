import { randomInt } from "crypto";
import { prisma } from "./prisma";

// 8 haneli rastgele müşteri numarası (10000000 - 99999999).
// Tahmin edilmesi zor + giriş ekranında hız sınırı ile korunur.
export async function generateCustomerNo(): Promise<string> {
  for (let i = 0; i < 25; i++) {
    const no = String(randomInt(10_000_000, 100_000_000));
    const exists = await prisma.customer.findUnique({
      where: { customerNo: no },
      select: { id: true },
    });
    if (!exists) return no;
  }
  throw new Error("Benzersiz müşteri numarası üretilemedi.");
}
