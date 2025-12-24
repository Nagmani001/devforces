import AuthTop from '@/app/components/authTopComponent';
import SigninForm from './signin-form';


export default function SigninPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <AuthTop topic="Nebula" title="Welcome back" description="Sign in to continue your journey" />
        <SigninForm />

      </div>
    </div>
  );
}
