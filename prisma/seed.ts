import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedProgramExercises } from "./seed/exercises";
import { seedProgramEccentric } from "./seed/program-eccentric-upper-lower";

// RUN: npx prisma db seed
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Optional: seed users (uncomment when needed)

  const passwordHash = await bcrypt.hash("Testingtest", 10);

  await prisma.user.upsert({
    where: { email: "merelbjacobs@gmail.com" },
    update: {},
    create: {
      email: "merelbjacobs@gmail.com",
      password: passwordHash,
      role: "TEAM",
    },
  });

  console.log("✅ Seeding users");
  await main();
  //  console.log("✅ Seeded program exercises");

  //  await seedProgramEccentric();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
