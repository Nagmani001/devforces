import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BASE_URL_CLIENT } from "../config/utils";


export default function useAdminContest() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["adminContests"],
    //    queryFn: axios.get(`${BASE_URL}/api`)
  });
  return {
    isPending,
    isError,
    data,
    error
  };
}
