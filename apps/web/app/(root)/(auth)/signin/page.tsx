"use client"
import { sampleTestimonials } from '@/app/config/consts';
import { SignInPage } from './sign-in';

const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  alert(`Sign In Submitted! Check the browser console for form data.`);
};

const handleGoogleSignIn = () => {
  alert("Continue with Google clicked");
};

const handleResetPassword = () => {
  alert("Reset Password clicked");
}

const handleCreateAccount = () => {
  alert("Create Account clicked");
}
export default function SigninPage() {
  return (
    <div className="bg-background text-foreground overflow-hidden scroll-m-7">
      <SignInPage
        heroImageSrc="/founders.png"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}
