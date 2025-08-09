import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Egg, Users, BarChart3, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
    const [, setLocation] = useLocation();

    const handleLogin = () => {
        setLocation("/login");
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 gap-4 sm:gap-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                                <Egg className="text-white text-base sm:text-lg" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                                    PoultryPro
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    Farm Management System
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogin}
                            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                            size="sm"
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 sm:py-16 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 px-2">
                        Comprehensive Poultry Farm Management
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-slate-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                        Streamline your poultry operations with our integrated
                        platform for daily activities, inventory management,
                        employee administration, and business intelligence
                        reporting.
                    </p>
                    <Button
                        onClick={handleLogin}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    >
                        Get Started
                    </Button>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-12 sm:py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-12">
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-4 px-2">
                            Everything You Need to Manage Your Farm
                        </h3>
                        <p className="text-base sm:text-lg text-slate-600 px-4">
                            Designed for supervisors, general managers, and CEOs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        <Card className="h-full">
                            <CardHeader className="pb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <Egg className="text-primary text-lg sm:text-xl" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl">
                                    Daily Operations
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-base">
                                    Track egg collection, feed distribution,
                                    mortality, and medication administration
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader className="pb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <BarChart3 className="text-secondary text-lg sm:text-xl" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl">
                                    Inventory Management
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-base">
                                    Monitor stock levels, track expiration
                                    dates, and automate reorder alerts
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader className="pb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <Users className="text-success text-lg sm:text-xl" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl">
                                    HR Management
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-base">
                                    Manage employee records, payroll, schedules,
                                    and performance tracking
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="h-full">
                            <CardHeader className="pb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <Shield className="text-warning text-lg sm:text-xl" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl">
                                    Business Intelligence
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-base">
                                    Generate reports, analyze trends, and make
                                    data-driven decisions
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 sm:py-16 lg:py-20 bg-primary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 px-2">
                        Ready to Transform Your Farm Operations?
                    </h3>
                    <p className="text-base sm:text-lg lg:text-xl text-primary-foreground/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                        Join thousands of farm managers who trust PoultryPro to
                        optimize their operations, reduce costs, and increase
                        productivity.
                    </p>
                    <Button
                        onClick={handleLogin}
                        size="lg"
                        variant="secondary"
                        className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto"
                    >
                        Start Managing Your Farm
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center space-x-3 mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Egg className="text-white text-xs sm:text-sm" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold">
                            PoultryPro
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base px-4">
                        © 2024 PoultryPro Farm Management System. All rights
                        reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
