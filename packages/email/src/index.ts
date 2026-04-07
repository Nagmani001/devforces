import { Resend } from "resend";

let resend: Resend | null = null;

export function initEmail(resendApiKey: string) {
  resend = new Resend(resendApiKey);
}

function getResend(): Resend {
  if (!resend) {
    throw new Error("Email not initialized. Call initEmail() from backend first.");
  }
  return resend;
}

export async function sendEmail(otp: string, sendTo: string, type: string) {
  const client = getResend();

  if (type == "OTP") {
    const { data, error } = await client.emails.send({
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

    const { data, error } = await client.emails.send({
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
  const client = getResend();

  const { data, error } = await client.emails.send({
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
