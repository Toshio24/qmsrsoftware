import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const existing = await db.user.findFirst();
  if (existing) {
    console.log("Users already exist — skipping seed.");
    return;
  }

  const passwordHash = await hashPassword("ChangeMe123!");
  await db.user.create({
    data: {
      username: "admin",
      fullName: "System Administrator",
      email: "admin@example.com",
      role: "ADMIN",
      passwordHash,
      forcePasswordReset: true,
    },
  });

  console.log(
    "Seeded initial admin user — username: admin, password: ChangeMe123! (forced to change on first login)"
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
