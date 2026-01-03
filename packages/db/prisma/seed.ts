import prisma from "../src/index.ts";
import { userDatas, contestDatas, challengeDatas } from "./seedData.ts";

async function main() {
  const prismaCreateUser = userDatas.map((x: any) => {
    return prisma.user.create({
      data: x
    });
  })
  await prisma.$transaction(prismaCreateUser);

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
