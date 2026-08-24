"use client";

import { useRouter } from "next/navigation";
import { useUserInfo } from "../hooks/useUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { User, FileCode2, Settings, LogOut, Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { authClient } from "../config/auth-client";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function UserMenu() {
  const router = useRouter();
  const user = useUserInfo();
  const { theme, setTheme } = useTheme();

  if (!user.data) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-muted text-foreground font-bold text-sm cursor-pointer ring-offset-background transition hover:ring-2 hover:ring-primary ${user.data.isAdmin ? "ring-2 ring-yellow-400" : ""}`}
          aria-label="Account menu"
        >
          {user.data.imageUrl ? (
            <img
              src={user.data.imageUrl}
              alt={user.data.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{user.data.username.charAt(0).toUpperCase()}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 py-2">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-muted font-bold text-sm shrink-0">
            {user.data.imageUrl ? (
              <img
                src={user.data.imageUrl}
                alt={user.data.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user.data.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate text-foreground">
              {user.data.username}
            </span>
            {user.data.email && (
              <span className="text-xs text-muted-foreground truncate">
                {user.data.email}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/submissions")}>
          <FileCode2 className="mr-2 h-4 w-4" />
          My Submissions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
          Theme
        </DropdownMenuLabel>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon className="mr-2 h-4 w-4" />
            {label}
            {theme === value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/signin") } })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
