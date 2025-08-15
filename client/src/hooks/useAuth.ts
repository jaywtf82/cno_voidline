import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async (): Promise<User> => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, this is expected on first load
          throw new Error("Unauthorized");
        }
        const errorData = await response.text();
        throw new Error(`${response.status}: ${errorData}`);
      }

      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isAuthenticated: !!user && !error,
    isLoading,
    error: error && !isUnauthorizedError(error) ? error : null,
  };
}