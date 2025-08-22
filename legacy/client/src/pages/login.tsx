import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    const loginForm = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const loginMutation = useMutation({
        mutationFn: async (data: LoginForm) => {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Login failed");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/");
        },
    });

    const onLogin = (data: LoginForm) => {
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6 sm:space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Farm Harvest
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-gray-600">
                        Poultry Farm Management System
                    </p>
                </div>

                <Card>
                    <form onSubmit={loginForm.handleSubmit(onLogin)}>
                        <CardHeader className="text-center">
                            <CardTitle className="text-lg sm:text-xl">
                                Welcome back
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 px-4 sm:px-6">
                            {loginMutation.error && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {loginMutation.error.message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="Enter your email"
                                    {...loginForm.register("email")}
                                />
                                {loginForm.formState.errors.email && (
                                    <p className="text-sm text-red-600">
                                        {
                                            loginForm.formState.errors.email
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    {...loginForm.register("password")}
                                />
                                {loginForm.formState.errors.password && (
                                    <p className="text-sm text-red-600">
                                        {
                                            loginForm.formState.errors.password
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="px-4 sm:px-6">
                            <Button
                                type="submit"
                                className="w-full h-10 sm:h-11 text-sm sm:text-base"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Need access? Contact your farm owner to create an
                        account.
                    </p>
                </div>
            </div>
        </div>
    );
}
