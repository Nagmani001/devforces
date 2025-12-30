"use client";

import { Button } from "@repo/ui/components/button";
import { Sparkles } from "lucide-react";
import ThemeToggle from "./themeToggle";
import { useRouter } from "next/navigation";
import { useUserInfo } from "../hooks/useUser";

export default function NavBar() {
  const router = useRouter();
  const token = localStorage.getItem("token");

  const user = useUserInfo(token!);

  if (user.data) {
    console.log(user.data);
    // this is what the data looks like : {isAdmin: true, username: 'Nagmani', email: 'nagmanipd3@gmail.com'}
    // i want you to display a 
    return < nav className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto" >
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-blue-600" />
        <span className="text-2xl font-bold text-gray-900">Devforces</span>
      </div>
      <div>
        <div>user</div>
        <ThemeToggle />
      </div>
    </nav >
  } else {
    return < nav className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto" >
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-blue-600" />
        <span className="text-2xl font-bold text-gray-900">Devforces</span>
      </div>
      <div>
        <Button onClick={() => {
          router.push("/signin")
        }} variant="link">Login</Button>
        <ThemeToggle />
      </div>
    </nav >

  }


} 
