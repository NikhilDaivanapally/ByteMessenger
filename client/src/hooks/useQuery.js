import { useSearchParams } from "react-router-dom";

const useQuery = () => {
  const url = new URL(window.location.href);
  const [search] = useSearchParams(url);
  const token = search.get("token");
  return token;
};

export default useQuery;
