import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await prisma.admin.findFirst();
  if (!existing) {
    await prisma.admin.create({
      data: { username, passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`✅ Admin oluşturuldu → kullanıcı: ${username}`);
  } else {
    console.log("ℹ️  Admin zaten var, atlandı.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
