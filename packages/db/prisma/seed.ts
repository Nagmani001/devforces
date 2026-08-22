import prisma from "../src/index.ts";
import { hashPassword } from "better-auth/crypto";
import { userDatas, contestDatas, challengeDatas, usersSeedPassword } from "./seedData.ts";

async function main() {
  const hashedPassword = await hashPassword(usersSeedPassword);

  for (const userData of userDatas) {
    const user = await prisma.user.create({ data: userData });
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        issuer: "local:credential",
        password: hashedPassword,
        userId: user.id,
      },
    });
  }

  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true }
  });

  if (!adminUser) {
    throw new Error("No admin user found. Please ensure at least one admin user exists.");
  }

  const prismaCreateContests = contestDatas.map((contestData) => {
    return prisma.contest.create({
      data: {
        title: contestData.title,
        subtitle: contestData.subtitle,
        duration: contestData.duration,
        startsAt: contestData.startsAt,
        userId: adminUser.id,
      }
    });
  });

  const createdContests = await prisma.$transaction(prismaCreateContests);

  const prismaCreateChallenges = challengeDatas.map((challengeData) => {
    return prisma.challenge.create({
      data: {
        title: challengeData.title,
        notionLink: challengeData.notionLink,
        testFile: challengeData.testFile,
        baseGithubUrl: challengeData.baseGithubUrl,
        totalTestCases: challengeData.totalTestCases,
        //@ts-ignore
        contestId: createdContests[challengeData.contestIndex].id,
      }
    });
  });

  await prisma.$transaction(prismaCreateChallenges);

  console.log("✅ Seeding completed successfully!");
  console.log(`   - Created ${userDatas.length} users`);
  console.log(`   - Created ${contestDatas.length} contests`);
  console.log(`   - Created ${challengeDatas.length} challenges`);
}

main();
