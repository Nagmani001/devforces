import SigninForm from './signin-form';

export default function SigninPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <SigninForm />
      </div>
    </div>
  );
}
