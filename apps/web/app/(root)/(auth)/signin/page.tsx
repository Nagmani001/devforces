"use client";

import { ChangeEvent, useState } from 'react';
import AuthTop from '@/app/components/authTopComponent';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { BASE_URL } from '@/app/config/utils';
import { toast } from 'sonner';
import { signinType } from '@/app/config/types';
import LabbledInput from '@repo/ui/components/labbledInput';


export default function SigninPage() {
  const [signinData, setSigninData] = useState({
    email: "",
    password: ""
  });

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (user: signinType) => {
      return axios.post(`${BASE_URL}/api/auth/signin`, user, {
        withCredentials: true
      });
    },
    onError: (error: any) => {
      console.log(error);
      toast.error("something went wrong");
    },
    onSuccess: (success: any) => {
      toast.success("successfully sigined in");
      localStorage.setItem("token", success.data.token);
      router.push(`/contests`);
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(signinData)
  };


  function handleForgotPassword() {

  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <AuthTop topic="Nebula" title="Welcome back" description="Sign in to continue your journey" />

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <LabbledInput
              label="Email Address"
              value={signinData.email}
              isPassword={false}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSigninData((prev) => {
                  return {
                    ...prev,
                    email: e.target.value
                  }
                })
              }}
            />

            <LabbledInput
              label="Password"
              value={signinData.password}
              isPassword={true}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSigninData((prev) => {
                  return {
                    ...prev,
                    password: e.target.value
                  }
                })
              }}
            />


            <div className="flex items-center justify-end">
              <Button
                variant="link"
                type="button"
                onClick={handleForgotPassword}
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
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
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
      </div>
    </div>
  );
}
