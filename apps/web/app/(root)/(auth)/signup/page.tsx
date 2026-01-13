"use client";
import { SignUpPage } from "./sign-up";
import { sampleTestimonials } from "@/app/config/consts";

const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const data = Object.fromEntries(formData.entries());
  console.log("Sign In submitted:", data);
  alert(`Sign In Submitted! Check the browser console for form data.`);
};

const handleGoogleSignIn = () => {
  console.log("Continue with Google clicked");
  alert("Continue with Google clicked");
};

const handleResetPassword = () => {
  alert("Reset Password clicked");
}

const handleCreateAccount = () => {
  alert("Create Account clicked");
}

export default function SignupPage() {
  return (
    <div className="bg-background text-foreground overflow-hidden scroll-m-7">
      <SignUpPage
        heroImageSrc="https://school.100xdevs.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fsuperlabs-3.cf62a668.jpeg&w=3840&q=75"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}
