"use client";

import { authClient } from "../config/auth-client";

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  username?: string | null;
  isAdmin?: boolean;
};

export function useUserInfo() {
  const { data, isPending, error } = authClient.useSession();

  const user = data?.user as SessionUser | undefined;

  return {
    isPending,
    error,
    data: user
      ? {
          id: user.id,
          username: user.username ?? "",
          email: user.email,
          imageUrl: user.image ?? null,
          isAdmin: !!user.isAdmin
        }
      : null
  };
}
