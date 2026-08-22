"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import OtpArea from "@repo/ui/components/otpPage";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { authClient } from "@/app/config/auth-client";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({
      email
    });
    setIsPending(false);
    if (error) {
      toast.error(error.message || "failed to send otp");
      return;
    }
    setStep("reset");
    toast.success("an otp has been sent to your email");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!otp) {
      toast.error("please enter the otp");
      return;
    }
    if (password.length < 5) {
      toast.error("password must be at least 5 characters");
      return;
    }
    setIsPending(true);
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password
    });
    setIsPending(false);
    if (error) {
      toast.error(error.message || "failed to reset password");
      return;
    }
    toast.success("password reset successfully, please sign in");
    router.push("/signin");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            {step === "email" ? (
              <KeyRound className="w-8 h-8 text-primary" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {step === "email" ? "Reset Your Password" : "Enter Verification Code"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step === "email" ? (
              <>
                Enter the email address associated with your account
                <br />
                and we&apos;ll send you a verification code.
              </>
            ) : (
              <>
                We&apos;ve sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
                <br />
                Enter it below along with your new password.
              </>
            )}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="mt-2 w-full bg-transparent border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 focus:outline-none focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
              >
                {isPending ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="flex justify-center">
                <OtpArea
                  onChange={(e: string) => {
                    setOtp(e.toString());
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">New Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your new password"
                  className="mt-2 w-full bg-transparent border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 focus:outline-none focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
              >
                {isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => router.push("/signin")}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
