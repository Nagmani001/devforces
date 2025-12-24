import Link from "next/link";

export default function Hero() {
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
    <Link className="bg-primary rounded-md text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3" href="/signup" prefetch>
      Get Started
    </Link>
  </div>
}
