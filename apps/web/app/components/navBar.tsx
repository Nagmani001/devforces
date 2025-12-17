"use client";

import { Button } from "@repo/ui/components/button";
import { Sparkles } from "lucide-react";
import ThemeToggle from "./themeToggle";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import UserButton from "./userButton";

export default function NavBar() {
  const router = useRouter();
  const user = useUser();

  return < nav className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto" >
    <div className="flex items-center gap-2">
      <Sparkles className="w-8 h-8 text-blue-600" />
      <span className="text-2xl font-bold text-gray-900">Devforces</span>
    </div>
    <div>
      {!user.success ?
        <Button onClick={() => {
          router.push("/signin")
        }} variant="link">Login</Button>
        // @ts-ignore
        : <UserButton name={user.userInfo.username} />}
      <ThemeToggle />
    </div>
  </nav >

} 
