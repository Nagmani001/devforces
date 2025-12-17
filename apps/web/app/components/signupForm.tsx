"use client";

import axios from "axios";
import { useState } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { useMutation } from '@tanstack/react-query';

export default function SignupForm() {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (user) => {
      return axios.post("", user);
    }
  });

  return <form onSubmit={() => {
  }} className="space-y-6">
    <div>
      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
        Full Name
      </label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          placeholder="John Doe"
          required
        />
      </div>
    </div>

    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
        Email Address
      </label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          placeholder="you@example.com"
          required
        />
      </div>
    </div>

    <div>
      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
        Password
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          placeholder="Create a strong password"
          required
        />
      </div>
    </div>

    <Button
      type="submit"
      className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
    >
      Create Account
    </Button>
  </form>
}
