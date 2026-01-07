import { Resend } from "resend";
import { config } from "dotenv";

config({ path: "/home/nagmani/root/projects/devforces/packages/email/.env" });

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
  } else if (type == "FORGOT_PASSWORD") {

    const { data, error } = await resend.emails.send({
      from: 'Nagmani <nagmani@email.nagmaniupadhyay.com.np>',
      to: [sendTo],
      subject: "forgot password OTP",
      html: `<strong>Use this otp for logging in to your account or changing your password: ${otp}</strong>`
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

export async function notifyUser(sendTo: string, timeStamp: Date, contestLink: string) {
  const { data, error } = await resend.emails.send({
    from: 'Nagmani <nagmani@email.nagmaniupadhyay.com.np>',
    to: [sendTo],
    subject: "notification about contest",
    html: `<strong>The contest will start in 5 minutes , please be ready <a href=${contestLink}>appearn for contest now </a></strong>`,
    scheduledAt: timeStamp.toString()
  });

  if (error) {
    return {
      success: false,
      message: "error sending email"
    };
  }

  return {
    success: true,
    message: "sent scheduled successfully"
  }
}
