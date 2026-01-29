import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BASE_URL_CLIENT } from "../config/utils";

async function fetchUserInfo() {
  const userInfo = await axios.get(`${BASE_URL_CLIENT}/api/auth/me`, {
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });
  return userInfo.data
}

export function useUserInfo() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['userInfo'],
    queryFn: () => fetchUserInfo(),
  })
  return { isPending, isError, data, error }
}
