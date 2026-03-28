import { useEffect, useState } from "react";

type UseQueryArgs<T> = {
  queryKey: Array<string | number | boolean>;
  queryFn: () => Promise<T>;
  initialData: T;
  enabled?: boolean;
};

export const useQuery = <T>({
  queryKey,
  queryFn,
  initialData,
  enabled = true,
}: UseQueryArgs<T>) => {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const key = JSON.stringify(queryKey);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let didCancel = false;

    const fetchData = async () => {
      setIsError(false);
      setErrorMessage("");
      setIsLoading(true);

      try {
        const result = await queryFn();
        if (!didCancel) {
          setData(result);
        }
      } catch (error) {
        if (!didCancel) {
          setIsError(true);
          setErrorMessage(
            error instanceof Error ? error.message : "Something went wrong.",
          );
        }
      } finally {
        if (!didCancel) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      didCancel = true;
    };
  }, [enabled, key, queryFn]);

  return { data, isLoading, isError, errorMessage };
};
