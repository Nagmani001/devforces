"use client";
import { Button } from "@repo/ui/components/button";
import OtpArea from "@repo/ui/components/otpPage";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Clock, ShieldCheck, Mail } from "lucide-react";
import { authClient } from "@/app/config/auth-client";

export default function OtpClient({ email }: { email: string }) {
  const [otp, setOtp] = useState({
    otp: ""
  });
  const [timeLeft, setTimeLeft] = useState(300);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const isExpired = timeLeft === 0;

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      toast.error("OTP verification time expired");
    }
  }, [isExpired]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  interface otp {
    otp: string;
  }

  const mutation = useMutation({
    mutationFn: async (value: otp) => {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: value.otp
      });
      if (error) {
        throw new Error(error.message || "Invalid OTP. Please try again.");
      }
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Invalid OTP. Please try again.");
    },
    onSuccess: () => {
      toast.success("OTP verified successfully!");
      router.push(`/contests/1`);
    }
  });

  async function handleResend() {
    setIsResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification"
    });
    setIsResending(false);
    if (error) {
      toast.error(error.message || "failed to resend otp");
      return;
    }
    setTimeLeft(300);
    toast.success("a new otp has been sent to your email");
  }


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Verify Your Email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&apos;ve sent a 6-digit verification code to <span className="font-medium text-foreground">{email}</span>.
            <br />
            Please enter it below to continue.
          </p>
        </div>

        {/* Timer Section */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Clock className={`w-4 h-4 ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className={`text-sm font-medium ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
            {isExpired ? 'Code Expired' : `Time remaining: ${formatTime(timeLeft)}`}
          </span>
        </div>

        {/* OTP Input Section */}
        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <div className="flex justify-center mb-6">
            <OtpArea onChange={(e: string) => {
              setOtp({
                otp: e.toString()
              });
            }} />
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => {
              mutation.mutate(otp);
            }}
            disabled={mutation.isPending || isExpired}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the code? Check your spam folder or request a new one.
          </p>
          <Button
            variant="link"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-primary hover:text-primary/80 font-medium underline-offset-4"
          >
            {isResending ? 'Resending...' : 'Resend Code'}
          </Button>
        </div>
      </div>
    </div>
  );
}
