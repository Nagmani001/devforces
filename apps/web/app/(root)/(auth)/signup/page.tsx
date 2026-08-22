"use client";
import { SignUpPage } from "./sign-up";
import { sampleTestimonials } from "@/app/config/consts";
import { signInWithGoogle } from "@/app/config/auth-client";

export default function SignupPage() {
  return (
    <div className="bg-background text-foreground overflow-hidden scroll-m-7">
      <SignUpPage
        heroImageSrc="/founder_harkirat.png"
        testimonials={sampleTestimonials}
        onGoogleSignIn={() => {
          signInWithGoogle();
        }}
      />
    </div>
  );
}
