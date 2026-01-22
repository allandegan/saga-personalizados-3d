import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertUser({ name, username, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      name,
      role,
      passwordHash
    },
    create: {
      name,
      username,
      role,
      passwordHash
    },
    select: { id: true, name: true, username: true, role: true, createdAt: true }
  });

  return user;
}

async function main() {
  const users = [];

  users.push(
    await upsertUser({
      name: "Allan",
      username: "Allan",
      password: "@Degan_2023",
      role: "ADMIN"
    })
  );

  users.push(
    await upsertUser({
      name: "Giselle",
      username: "Gisa",
      password: "Gisa170321@",
      role: "ADMIN"
    })
  );

  console.log("✅ Admins criados/atualizados:");
  console.table(users);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
