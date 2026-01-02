import prisma from "@repo/db/client";
interface User {
  email: string,
  password: string,
  username: string
}
export async function createUser({ email, username, password }: User) {
  await prisma.user.create({
    data: {
      username,
      email,
      password,
      isVerified: true,
      otp: "232323",
      otpExpiry: new Date()
    }
  });
}
