import { Resend } from "resend";
import { config } from "dotenv";

config({ path: "/home/nagmani/root/projects/devforces/packages/email/.env" });

console.log("api key ", process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(otp: string, sendTo: string, type: string) {
  if (type == "OTP") {
    const { data, error } = await resend.emails.send({
      from: 'Nagmani <nagmani@email.nagmaniupadhyay.com.np>',
      to: [sendTo],
      subject: "signup OTP",
      html: `<strong>Thanks for signing up this is your otp: ${otp}</strong>`
    });

    if (error) {
      return {
        success: false,
        message: "error sending email"
      };
    }

    return {
      success: true,
      message: "sent email successfully"
    }
  }
}
