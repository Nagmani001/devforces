import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BASE_URL } from "../config/utils";

async function fetchUserInfo(token: string) {
  try {
    const userInfo = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: token
      }
    });
    return {
      success: true,
      data: userInfo.data
    }

  } catch (err) {
    return {
      success: true,
    }
  }
}

export function useUserInfo(token: string) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['userInfo'],
    queryFn: () => fetchUserInfo(token),
  })
  return { isPending, isError, data, error }
}
