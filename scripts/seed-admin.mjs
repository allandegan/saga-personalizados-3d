import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline";

const prisma = new PrismaClient();

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  const name = await ask("Nome: ");
  const username = await ask("Usuario (login): ");
  const password = await ask("Senha: ");

  if (!name || !username || !password) {
    console.error("Preencha nome, usuario e senha.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existingCount = await prisma.user.count();
  if (existingCount >= 5) {
    console.error("Limite de 5 usuarios atingido.");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { username },
    update: { name, passwordHash, role: "ADMIN" },
    create: { name, username, passwordHash, role: "ADMIN" }
  });

  console.log(`OK: ADMIN criado/atualizado -> ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
