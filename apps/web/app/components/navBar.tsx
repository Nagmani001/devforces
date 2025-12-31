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

    return < nav className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto" >
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-blue-600" />
        <span className="text-2xl font-bold text-gray-900">Devforces</span>
      </div>
      <div className="flex items-center gap-4">
        <div className={`relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 text-gray-700 font-bold ${user.data.isAdmin ? "border-2 border-yellow-400" : ""}`}>
          {user.data.imageUrl ? (
            <img src={user.data.imageUrl} alt={user.data.username} className="w-full h-full object-cover" />
          ) : (
            <span>{user.data.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
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
