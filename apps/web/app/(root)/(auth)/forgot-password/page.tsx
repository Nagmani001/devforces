"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import { authClient } from "@/app/config/auth-client";
import { OtpDialog } from "@/app/components/otpDialog";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsSending(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({
      email
    });
    setIsSending(false);
    if (error) {
      toast.error(error.message || "failed to send otp");
      return;
    }
    toast.success("an otp has been sent to your email");
    setOtpOpen(true);
  }

  async function handleResetPassword(otp: string) {
    if (password.length < 5) {
      toast.error("password must be at least 5 characters");
      return;
    }
    setIsResetting(true);
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password
    });
    setIsResetting(false);
    if (error) {
      toast.error(error.message || "failed to reset password");
      return;
    }
    toast.success("password reset successfully, please sign in");
    setOtpOpen(false);
    router.push("/signin");
  }

  async function handleResendOtp(): Promise<boolean> {
    setIsResending(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({
      email
    });
    setIsResending(false);
    if (error) {
      toast.error(error.message || "failed to resend otp");
      return false;
    }
    toast.success("a new otp has been sent to your email");
    return true;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Reset Your Password
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enter the email address associated with your account
            <br />
            and we&apos;ll send you a verification code.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-6">
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
              disabled={isSending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
            >
              {isSending ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
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

      <OtpDialog
        isOpen={otpOpen}
        onOpenChange={setOtpOpen}
        email={email}
        title="Reset Your Password"
        description={
          <>
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            <br />
            Enter it below along with your new password.
          </>
        }
        submitLabel="Reset Password"
        onSubmit={handleResetPassword}
        onResend={handleResendOtp}
        isLoading={isResetting}
        isResending={isResending}
      >
        <div>
          <label className="text-sm font-medium text-foreground">New Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            name="password"
            type="password"
            required
            minLength={5}
            placeholder="Enter your new password"
            className="mt-2 w-full bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 focus:outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px] transition-all"
          />
        </div>
      </OtpDialog>
    </div>
  );
}
