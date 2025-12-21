/*
import bcrypt from "bcrypt";

import prisma from ".";
async function seedDb() {
  const hashedPassword: string = await bcrypt.hash("itsboy", 10);
  await prisma.$transaction([
    prisma.user.create({
      data: {
        username: "nagmani",
        email: "nagmanipd3@gmail.com",
        password: hashedPassword,
        otp: "123456",
        otpExpiry: new Date()
      }
    })
  ])


}
seedDb();
  */
