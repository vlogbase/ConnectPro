import { useQuery } from "@tanstack/react-query";

export interface User {
  userId: number;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  sub: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
