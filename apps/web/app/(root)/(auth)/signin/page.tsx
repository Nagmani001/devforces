"use client"
import { sampleTestimonials } from '@/app/config/consts';
import { SignInPage } from './sign-in';
import { signInWithGoogle } from '@/app/config/auth-client';

export default function SigninPage() {
  return (
    <div className="bg-background text-foreground overflow-hidden scroll-m-7">
      <SignInPage
        heroImageSrc="/founders.png"
        testimonials={sampleTestimonials}
        onGoogleSignIn={() => {
          signInWithGoogle();
        }}
      />
    </div>
  );
}
