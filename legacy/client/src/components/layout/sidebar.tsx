import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    Egg,
    CalendarCheck,
    Package,
    Users,
    DollarSign,
    BarChart3,
    Heart,
    Menu,
    X,
    CheckSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Management/Admin navigation
const managementNavigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Daily Activities", href: "/activities", icon: CalendarCheck },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Finances", href: "/finances", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Health & Vet", href: "/health", icon: Heart },
];

// Employee navigation
const employeeNavigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "My Tasks", href: "/my-tasks", icon: CheckSquare },
    { name: "Activities", href: "/activities", icon: CalendarCheck },
    { name: "Health & Vet", href: "/health", icon: Heart },
];

export default function Sidebar() {
    const [location] = useLocation();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        window.location.href = "/api/logout";
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Determine navigation based on user role
    const isManagement =
        user?.role === "admin" ||
        user?.role === "ceo" ||
        user?.role === "general_manager";
    const navigation = isManagement ? managementNavigation : employeeNavigation;

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="bg-white shadow-md"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Menu className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "w-64 bg-white shadow-lg border-r border-slate-200 fixed h-full overflow-y-auto z-40 transition-transform duration-200 ease-in-out",
                    "lg:translate-x-0",
                    isMobileMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Egg className="text-white text-lg" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">
                                PoultryPro
                            </h1>
                            <p className="text-xs text-slate-500">
                                Farm Management
                            </p>
                        </div>
                    </div>
                </div>

                {/* User Profile Section */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                            <AvatarImage
                                src={user?.profileImageUrl || ""}
                                alt={user?.firstName || ""}
                            />
                            <AvatarFallback>
                                {user?.firstName?.[0]}
                                {user?.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                                {user?.role?.replace("_", " ") || "User"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = location === item.href;
                            const Icon = item.icon;

                            return (
                                <li key={item.name}>
                                    <Link href={item.href}>
                                        <div
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                                isActive
                                                    ? "bg-primary text-white"
                                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                            onClick={closeMobileMenu}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full"
                    >
                        Sign Out
                    </Button>
                </div>
            </aside>
        </>
    );
}
