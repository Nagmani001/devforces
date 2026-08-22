import { cookies } from "next/headers";
import axios from "axios";
import { BASE_URL } from "./utils";

export type AuthSession = {
  id: string;
  username: string;
  email: string;
  imageUrl: string | null;
  isAdmin: boolean;
};

function mapSession(data: {
  user?: {
    id?: string;
    email?: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
    isAdmin?: boolean;
  };
} | null): AuthSession | null {
  if (!data?.user?.id) return null;
  return {
    id: data.user.id,
    username: data.user.username ?? data.user.name ?? "",
    email: data.user.email ?? "",
    imageUrl: data.user.image ?? null,
    isAdmin: !!data.user.isAdmin
  };
}

// forwards the incoming request's cookies to the backend (server components only)
async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

// axios GET with the request's cookies forwarded
export async function authedGet(url: string) {
  const cookieHeader = await getCookieHeader();
  return axios.get(url, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {}
  });
}

// resolves the better-auth session from the incoming request cookies (server components only)
export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const res = await authedGet(`${BASE_URL}/api/auth/get-session`);
    return mapSession(res.data);
  } catch {
    return null;
  }
}

export async function getContest(page: string) {
  try {
    const me = await getAuthSession();

    let contests;
    let isAdmin: boolean;

    if (me?.isAdmin) {
      isAdmin = true;
      const response = await authedGet(`${BASE_URL}/api/admin/contest?page=${page}`);
      contests = response.data;
    } else {
      isAdmin = false;
      const response = await authedGet(`${BASE_URL}/api/user/contest?page=${page}`);
      contests = response.data;
    }

    return {
      success: true,
      contests,
      isAdmin
    };
  } catch (err) {
    return {
      success: false,
      message: "invalid or missing token"
    };
  }
}

export async function getChallengesForContest(contestId: string) {
  const response = await authedGet(`${BASE_URL}/api/user/contest/${contestId}/challenges`);
  return {
    challenges: response.data
  };
}

export async function getChallengeDetails(challengeId: string) {
  try {
    const challenge = await authedGet(`${BASE_URL}/api/user/contest/challenge/${challengeId}`);
    return {
      success: true,
      data: challenge
    };
  } catch (err) {
    return {
      success: false as const,
      data: undefined
    };
  }
}
