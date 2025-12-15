import { Button } from '@repo/ui/components/button';
import { Shield, Zap, Users } from 'lucide-react';
import NavBar from './components/navBar';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center  mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to the Future
            <br />
            <span className="text-blue-600">of Innovation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your ideas into reality with our cutting-edge platform.
            Join thousands of innovators who are building the future today.
          </p>
          <Button size="lg">
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
            <p className="text-gray-600">
              Experience blazing fast performance that keeps you ahead of the competition.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
            <p className="text-gray-600">
              Your data is protected with enterprise-grade security measures.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Built for Teams</h3>
            <p className="text-gray-600">
              Collaborate seamlessly with your team members in real-time.
            </p>
          </div>
        </div>
      </main >
    </div >
  );
}
