"use client";
import { toast } from "sonner"
import axios from "axios";
import { ChangeEvent, FormEvent, useCallback, useState } from 'react';
import { Button } from '@repo/ui/components/button';
import LableWithInput from "@repo/ui/components/labbledInput";
import { useMutation } from '@tanstack/react-query';
import { useRouter } from "next/navigation";
import { BASE_URL_CLIENT } from "@/app/config/utils";
import { signupSchema } from "@repo/common/zodTypes";
import { signupType } from "@/app/config/types";

export default function SignupForm() {
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
            onClick={useCallback(() => {
              router.push("/signin")
            }, [])}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Button>
        </p>
      </div>
    </>
  );
}
