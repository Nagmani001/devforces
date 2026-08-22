import prisma from "@repo/db/client";
import { hashPassword } from "better-auth/crypto";

interface AdminUser {
    email: string;
    password: string;
    username: string;
}

export async function createAdminUser({ email, username, password }: AdminUser) {
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            name: username,
            username,
            email,
            emailVerified: true,
            isAdmin: true
        }
    });
    await prisma.account.create({
        data: {
            accountId: user.id,
            providerId: "credential",
            issuer: "local:credential",
            password: hashedPassword,
            userId: user.id
        }
    });
    return user;
}

export async function createContest(userId: string, overrides: any = {}) {
    const defaultData = {
        title: "Test Contest",
        subtitle: "Test subtitle",
        duration: 3600,
        startsAt: new Date(),
        userId,
        ...overrides
    };

    const contest = await prisma.contest.create({
        data: defaultData
    });
    return contest;
}

export async function createChallenge(contestId: string, overrides: any = {}) {
    const defaultData = {
        title: "Test Challenge",
        notionLink: "https://notion.so/test",
        testFile: "test file content",
        baseGithubUrl: "https://github.com/test/repo",
        totalTestCases: 5,
        contestId,
        ...overrides
    };

    const challenge = await prisma.challenge.create({
        data: defaultData
    });
    return challenge;
}
