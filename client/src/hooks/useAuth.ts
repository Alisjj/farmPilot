import { useQuery } from "@tanstack/react-query";

interface User {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    profileImageUrl: string | null;
    emailVerified: boolean | null;
    createdAt: Date;
    updatedAt: Date;
}

export function useAuth() {
    const {
        data: user,
        isLoading,
        error,
    } = useQuery<User>({
        queryKey: ["/api/auth/user"],
        retry: false,
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user && !error,
    };
}
