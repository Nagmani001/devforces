"use client";

import { Button } from "@repo/ui/components/button";
import { Sparkles } from "lucide-react";
import ThemeToggle from "./themeToggle";

export default function NavBar() {
  return <nav className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
    <div className="flex items-center gap-2">
      <Sparkles className="w-8 h-8 text-blue-600" />
      <span className="text-2xl font-bold text-gray-900">Nebula</span>
    </div>
    <Button variant="link">Login</Button>
    <ThemeToggle />
  </nav>

} 
