"use client"

import { FormEvent, ReactNode, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@repo/ui/components/dialog"
import { OtpInput } from "@repo/ui/components/otp-input"
import { Button } from "@repo/ui/components/button"
import { Clock, ShieldCheck } from "lucide-react"

interface OtpDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  email: string
  title?: string
  description?: ReactNode
  submitLabel?: string
  isLoading?: boolean
  isResending?: boolean
  onSubmit: (otp: string) => void
  onResend: () => Promise<boolean> | boolean
  children?: ReactNode
}

const OTP_EXPIRES_IN = 300

export function OtpDialog({
  isOpen,
  onOpenChange,
  email,
  title = "Verify your email",
  description,
  submitLabel = "Verify Email",
  isLoading = false,
  isResending = false,
  onSubmit,
  onResend,
  children,
}: OtpDialogProps) {
  const [otp, setOtp] = useState("")
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRES_IN)
  const isExpired = timeLeft === 0

  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  function handleOpenChange(open: boolean) {
    onOpenChange(open)
    if (!open) {
      setOtp("")
      setTimeLeft(OTP_EXPIRES_IN)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  async function handleResend() {
    const ok = await onResend()
    if (ok) {
      setOtp("")
      setTimeLeft(OTP_EXPIRES_IN)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (otp.length === 6 && !isExpired && !isLoading) {
      onSubmit(otp)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl p-8 border-border sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {description ?? (
                <>
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Clock
              className={`w-4 h-4 ${isExpired ? "text-destructive" : "text-muted-foreground"}`}
            />
            <span
              className={`text-sm font-medium ${isExpired ? "text-destructive" : "text-foreground"}`}
            >
              {isExpired ? "Code expired" : `Time remaining: ${formatTime(timeLeft)}`}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

            {children}

            <Button
              type="submit"
              disabled={otp.length !== 6 || isLoading || isExpired}
              className="w-full py-3 h-auto rounded-xl font-medium text-sm"
            >
              {isLoading ? "Verifying..." : submitLabel}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Didn&apos;t receive a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading || isResending}
              className="text-primary hover:underline disabled:opacity-50 transition-opacity"
            >
              {isResending ? "Resending..." : "Resend"}
            </button>
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
