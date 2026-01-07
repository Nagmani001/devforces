import prisma from "@repo/db/client";

interface AdminUser {
    email: string;
    password: string;
    username: string;
}

export async function createAdminUser({ email, username, password }: AdminUser) {
    const user = await prisma.user.create({
        data: {
            username,
            email,
            password,
            isVerified: true,
            isAdmin: true,
            otp: "123456",
            otpExpiry: new Date()
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
