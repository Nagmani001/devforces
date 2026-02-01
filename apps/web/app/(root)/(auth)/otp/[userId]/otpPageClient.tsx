"use client";
import { BASE_URL_CLIENT } from "@/app/config/utils";
import { Button } from "@repo/ui/components/button";
import OtpArea from "@repo/ui/components/otpPage";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect, FormEvent } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Clock, ShieldCheck, Mail } from "lucide-react";

export default function OtpClient({ userId }: any) {
  const [otp, setOtp] = useState({
    otp: ""
  });
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === 0) {
      setIsExpired(true);
      toast.error("OTP verification time expired");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

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
    mutationFn: (value: otp) => {
      return axios.post(`${BASE_URL_CLIENT}/api/auth/verify-otp/${userId}`, value, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Invalid OTP. Please try again.";
      toast.error(message);
    },
    onSuccess: (success) => {
      toast.success("OTP verified successfully!");
      localStorage.setItem("token", success.data.token);
      router.push(`/contests/1`);
    }
  });


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
            We've sent a 6-digit verification code to your email address.
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
            <OtpArea onChange={(e: any) => {
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
            Didn't receive the code? Check your spam folder or request a new one.
          </p>
          <Button
            variant="link"
            onClick={() => {
              // TODO: Implement resend OTP logic
              toast.info("Resend OTP feature coming soon");
            }}
            className="text-sm text-primary hover:text-primary/80 font-medium underline-offset-4"
          >
            Resend Code
          </Button>
        </div>
      </div>
    </div>
  );
}
