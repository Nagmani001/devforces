import AuthTop from "@/app/components/authTopComponent";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen  bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <AuthTop topic="Nebula" title="Create your account" description="Join us and start your journey today" />
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
