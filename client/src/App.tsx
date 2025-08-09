import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Activities from "@/pages/activities";
import MyTasks from "@/pages/my-tasks";
import Inventory from "@/pages/inventory";
import Employees from "@/pages/employees";
import Finances from "@/pages/finances";
import Reports from "@/pages/reports";
import Health from "@/pages/health";
import { useEffect } from "react";

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm sm:text-base text-slate-600">
                    Loading...
                </p>
            </div>
        </div>
    );
}

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: any }) {
    const { isAuthenticated, isLoading } = useAuth();
    const [, navigate] = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate("/login");
        }
    }, [isLoading, isAuthenticated, navigate]);

    if (isLoading) return <LoadingScreen />;
    if (!isAuthenticated) return null; // redirect in effect
    return <Component />;
}

function Router() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <LoadingScreen />;

    return (
        <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
            <Route
                path="/activities"
                component={() => <ProtectedRoute component={Activities} />}
            />
            <Route
                path="/my-tasks"
                component={() => <ProtectedRoute component={MyTasks} />}
            />
            <Route
                path="/inventory"
                component={() => <ProtectedRoute component={Inventory} />}
            />
            <Route
                path="/employees"
                component={() => <ProtectedRoute component={Employees} />}
            />
            <Route
                path="/finances"
                component={() => <ProtectedRoute component={Finances} />}
            />
            <Route
                path="/reports"
                component={() => <ProtectedRoute component={Reports} />}
            />
            <Route
                path="/health"
                component={() => <ProtectedRoute component={Health} />}
            />
            <Route component={NotFound} />
        </Switch>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Router />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;
