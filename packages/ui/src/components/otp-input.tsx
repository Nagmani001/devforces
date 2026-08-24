"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
}

function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: OtpInputProps) {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([])

  const digits = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length)

  function focusInput(index: number) {
    inputsRef.current[index]?.focus()
  }

  function handleChange(index: number, char: string) {
    if (!/^\d?$/.test(char)) return

    const newDigits = [...digits]
    newDigits[index] = char
    const newValue = newDigits.join("").replace(/\s/g, "")
    onChange(newValue)

    if (char && index < length - 1) {
      focusInput(index + 1)
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      e.preventDefault()
      if (digits[index]) {
        handleChange(index, "")
      } else if (index > 0) {
        handleChange(index - 1, "")
        focusInput(index - 1)
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1)
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length)
    if (pasted) {
      onChange(pasted)
      focusInput(Math.min(pasted.length, length - 1))
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "w-11 h-13 text-center text-lg font-semibold rounded-xl",
            "bg-secondary border border-border text-foreground",
            "outline-none transition-all",
            "focus:border-ring focus:ring-ring/50 focus:ring-[3px]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  )
}

export { OtpInput }
export type { OtpInputProps }
