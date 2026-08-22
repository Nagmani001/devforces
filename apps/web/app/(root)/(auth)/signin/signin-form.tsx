"use client";
import { ChangeEvent, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { signinType } from '@/app/config/types';
import LabbledInput from '@repo/ui/components/labbledInput';
import { authClient } from '@/app/config/auth-client';

export default function SigninForm() {

  const [signinData, setSigninData] = useState({
    email: "",
    password: ""
  });

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (user: signinType) => {
      const { data, error } = await authClient.signIn.email({
        email: user.email,
        password: user.password
      });
      if (error) {
        throw new Error(error.message || "invalid email or password");
      }
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "something went wrong");
    },
    onSuccess: () => {
      toast.success("successfully signed in");
      router.push(`/contests/1`);
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(signinData)
  };

  function handleForgotPassword() {
    router.push("/forgot-password");
  }

  return <div className="bg-white rounded-2xl shadow-xl p-8">
    <form onSubmit={handleSubmit} className="space-y-6">
      <LabbledInput
        label="Email Address"
        value={signinData.email}
        isPassword={false}
        onChange={useCallback((e: ChangeEvent<HTMLInputElement>) => {
          setSigninData((prev) => {
            return {
              ...prev,
              email: e.target.value
            }
          })
        }, [])}
      />

      <LabbledInput
        label="Password"
        value={signinData.password}
        isPassword={true}
        onChange={useCallback((e: ChangeEvent<HTMLInputElement>) => {
          setSigninData((prev) => {
            return {
              ...prev,
              password: e.target.value
            }
          })
        }, [])}
      />


      <div className="flex items-center justify-end">
        <Button
          variant="link"
          type="button"
          onClick={() => {
            handleForgotPassword();
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Forgot password?
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
      >
        Sign In
      </Button> </form>

    <div className="mt-6 text-center">
      <p className="text-gray-600">
        Don&apos;t have an account?{' '}
        <Button
          variant="link"
          onClick={() => {
            router.push("/signup");
          }}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Sign up
        </Button>
      </p>
    </div>
  </div>

}
