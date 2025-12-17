"use client";

import { Button } from "@repo/ui/components/button";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  return <div className="text-center  mb-16">
    <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
      Welcome to the Future
      <br />
      <span className="text-blue-600">of Innovation</span>
    </h1>
    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Transform your ideas into reality with our cutting-edge platform.
      Join thousands of innovators who are building the future today.
    </p>
    <Button onClick={() => {
      router.push("/signup")
    }} size="lg">
      Get Started
    </Button>
  </div>
}
