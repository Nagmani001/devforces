import { useEffect, useState } from "react";
import { getUserInfo } from "../config/utils";

export function useUser() {
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const async = async () => {
      if (!token) return;
      try {
        const userInfo = await getUserInfo(token);
        setSuccess(true);
        setUserInfo(userInfo.data);
      } catch (err) {
        setSuccess(false);
      }
    }
    async();
  }, [token]);
  return {
    userInfo,
    success
  }
}
