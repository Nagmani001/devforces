import prisma, { PRISMA } from "@repo/db/client";

const tableNames = Object.keys(PRISMA.ModelName);

export async function resetDb() {
  for (const tableName of tableNames) {
    await prisma.$queryRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`)
  }
}
