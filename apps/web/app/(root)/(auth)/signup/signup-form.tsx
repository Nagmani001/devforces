"use client";
import { toast } from "sonner"
import { ChangeEvent, FormEvent, useCallback, useState } from 'react';
import { Button } from '@repo/ui/components/button';
import LableWithInput from "@repo/ui/components/labbledInput";
import { useMutation } from '@tanstack/react-query';
import { useRouter } from "next/navigation";
import { signupType } from "@/app/config/types";
import { authClient } from "@/app/config/auth-client";

export default function SignupForm() {
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (user: signupType) => {
      const { data, error } = await authClient.signUp.email({
        email: user.email,
        password: user.password,
        name: user.username,
        username: user.username,
      } as Parameters<typeof authClient.signUp.email>[0]);
      if (error) {
        throw new Error(error.message || "error while signing up");
      }
      return data;
    },

    onError: (error: Error) => {
      toast.error(error.message || "error while completing the requst");
    },
    onSuccess: () => {
      toast.success("account created, please verify with the otp sent to your email");
      router.push(`/otp/${encodeURIComponent(signupData.email)}`);
    }
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    mutation.mutate(signupData);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <LableWithInput
          label="Full Name"
          value={signupData.username}
          isPassword={false}
          onChange={useCallback((e: ChangeEvent<HTMLInputElement>) => {
            setSignupData((prev) => {
              return {
                ...prev,
                username: e.target.value
              }
            })
          }, [])}
        />
        <LableWithInput
          label="Email Address"
          value={signupData.email}
          isPassword={false}
          onChange={useCallback((e: ChangeEvent<HTMLInputElement>) => {
            setSignupData((prev) => {
              return {
                ...prev,
                email: e.target.value
              }
            })
          }, [])}
        />

        <LableWithInput
          label="Password"
          value={signupData.password}
          isPassword={true}
          onChange={useCallback((e: ChangeEvent<HTMLInputElement>) => {
            setSignupData((prev) => {
              return {
                ...prev,
                password: e.target.value
              }
            })
          }, [])}
        />

        {mutation.isPending ? <div>loading...</div> :
          <Button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            Create Account
          </Button>
        }
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Button
            variant="link"
            onClick={() => {
              router.push("/signin")
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Button>
        </p>
      </div>
    </>
  );
}
