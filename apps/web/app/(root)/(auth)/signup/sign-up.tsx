"use client"

import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { signupType } from '@/app/config/types';
import axios from 'axios';
import { BASE_URL_CLIENT } from '@/app/config/utils';
import { toast } from 'sonner';
import { signupSchema } from '@repo/common/zodTypes';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-2 rounded-xl border border-border bg-muted/50 backdrop-blur-sm transition-colors focus-within:border-primary focus-within:bg-primary/5">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => {
  return (
    <div style={{
      animation: "float 3s ease-in-out infinite",
    }} className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 rotate-5 scale-90  dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
      <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-3xl" alt="avatar" />
      <div className="text-sm leading-snug">
        <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
        <p className="text-muted-foreground">{testimonial.handle}</p>
        <p className="mt-1 text-foreground/80">{testimonial.text}</p>
      </div>
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>


  );
}

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignInPageProps> = ({
  title = <span className="font-normal text-foreground tracking-tight">Let's get you started</span>,
  description = "Keep your online test valid and develop fast ",
  heroImageSrc,
  testimonials,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (user: signupType) => {
      return axios.post(`${BASE_URL_CLIENT}/api/auth/signup`, user);
    },

    onError: (error: any) => {
      console.log(error);
      toast.error("error while completing the requst");
    },
    onSuccess: (success: any) => {
      toast.success("signed up successfully");
      router.push(`/otp/${success.data.userId}`);
    }
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsedData = signupSchema.safeParse(signupData);
    if (!parsedData.success) {
      console.log(parsedData.error.issues);
    }
    mutation.mutate(signupData);
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background md:flex-row font-geist w-auto">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 tracking-tight">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5">
              <div className="animate-element animate-delay-250">
                <label className="text-sm font-medium text-foreground">Username</label>
                <GlassInputWrapper>
                  <input
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setSignupData((prev) => {
                        return {
                          ...prev,
                          username: e.target.value
                        }
                      });
                    }}
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 rounded-xl focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setSignupData((prev) => {
                        return {
                          ...prev,
                          email: e.target.value
                        }
                      });
                    }}
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 rounded-xl focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>


              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-foreground">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setSignupData((prev) => {
                          return {
                            ...prev,
                            password: e.target.value
                          }
                        });
                      }}
                      name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 pr-12 rounded-xl focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-foreground">Keep me signed in</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-primary tracking-tight transition-colors">Reset password</a>
              </div>

              <button
                onClick={() => {
                  const parsedData = signupSchema.safeParse(signupData);
                  if (!parsedData.success) {
                    console.log(parsedData.error.issues);
                  }
                  mutation.mutate(signupData);
                }}
                type="button" className="animate-element animate-delay-600 w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign Up
              </button>
            </form>



            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              Already a user? <a href="/signin" className="text-primary hover:underline transition-colors">Sign in Now</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4 ">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials!.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials![0]} delay="animate-delay-1000" />
              <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials![1]} delay="animate-delay-1200" /></div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};  
