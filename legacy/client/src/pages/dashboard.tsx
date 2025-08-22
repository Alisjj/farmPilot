import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import KpiCards from "@/components/dashboard/kpi-cards";
import ActivityForms from "@/components/dashboard/activity-forms";
import InventoryStatus from "@/components/dashboard/inventory-status";
import EmployeeOverview from "@/components/dashboard/employee-overview";
import ExportPanel from "@/components/dashboard/export-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading, user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");

    // Redirect to home if not authenticated
    useEffect(() => {
        // Detect Cypress/E2E environment to avoid redirect race during tests
        const isE2E = typeof window !== "undefined" && (window as any).Cypress;
        if (!isE2E && !isLoading && !isAuthenticated) {
            toast({
                title: "Unauthorized",
                description: "You are logged out. Logging in again...",
                variant: "destructive",
            });
            setTimeout(() => {
                window.location.href = "/api/login";
            }, 500);
            return;
        }
    }, [isAuthenticated, isLoading, toast]);

    const { data: metrics, isLoading: metricsLoading } = useQuery({
        queryKey: ["/api/dashboard/metrics"],
        queryFn: () => apiRequest("/api/dashboard/metrics"),
        enabled: isAuthenticated,
    });

    const elevatedRoles = new Set(["admin"]);
    const canViewExecutive = user?.role === "admin";

    const { data: kpiSummary, isLoading: kpiLoading } = useQuery({
        queryKey: ["/api/kpi/summary"],
        queryFn: () => apiRequest("/api/kpi/summary"),
        enabled:
            isAuthenticated && activeTab === "executive" && canViewExecutive,
    });
    const exec = (kpiSummary || {}) as any;

    // Type-safe metrics access
    const safeMetrics = metrics as any;

    // Remove early return; render inline loader instead
    const showInlineLoading = isLoading || metricsLoading;

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />
            <main className="flex-1 lg:ml-64 ml-0 min-w-0">
                <TopHeader
                    title="Dashboard"
                    subtitle="Welcome back. Here's what's happening at your farm today."
                />
                <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
                    {showInlineLoading && (
                        <div
                            data-cy="dashboard-inline-loading"
                            className="bg-white border rounded-lg p-4 text-sm text-slate-500 flex items-center gap-3"
                        >
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            Loading dashboard data...
                        </div>
                    )}

                    {/* High Mortality Alert */}
                    {safeMetrics?.mortality > 5 && (
                        <Alert className="bg-accent/10 border-accent/20">
                            <AlertTriangle className="h-4 w-4 text-accent" />
                            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <div>
                                    <p className="text-accent font-medium">
                                        High Mortality Alert
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        Mortality exceeded threshold (
                                        {safeMetrics.mortality} birds today).
                                        Immediate attention required.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-accent hover:bg-accent/90 w-full sm:w-auto"
                                >
                                    View Details
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Dashboard Tabs */}
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="space-y-6"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger
                                value="overview"
                                data-cy="tab-overview"
                            >
                                Farm Overview
                            </TabsTrigger>
                            {canViewExecutive && (
                                <TabsTrigger
                                    value="executive"
                                    data-cy="tab-executive"
                                >
                                    Executive Dashboard
                                </TabsTrigger>
                            )}
                            <TabsTrigger
                                value="operations"
                                data-cy="tab-operations"
                            >
                                Daily Operations
                            </TabsTrigger>
                        </TabsList>

                        {/* Farm Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* KPI Cards */}
                            <KpiCards metrics={safeMetrics} />

                            {/* Charts and Data Section */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 w-full overflow-hidden">
                                {/* Production Chart Placeholder */}
                                <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6 w-full overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 gap-2">
                                        <h3 className="text-base lg:text-lg font-semibold text-slate-900">
                                            Egg Production Trends
                                        </h3>
                                        <select
                                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm w-full sm:w-auto"
                                            title="Select time range"
                                        >
                                            <option>Last 7 Days</option>
                                            <option>Last 30 Days</option>
                                            <option>Last Quarter</option>
                                        </select>
                                    </div>
                                    <div className="h-48 sm:h-64 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                                        <div className="text-center">
                                            <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-4" />
                                            <p className="text-sm sm:text-base text-slate-500">
                                                Production Trend Chart
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Real-time data visualization
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activities */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6 w-full overflow-hidden">
                                    <h3 className="text-base lg:text-lg font-semibold text-slate-900 mb-4">
                                        Recent Activities
                                    </h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        {safeMetrics?.recentActivities?.length >
                                        0 ? (
                                            safeMetrics.recentActivities.map(
                                                (
                                                    activity: any,
                                                    index: number
                                                ) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg"
                                                    >
                                                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                                                                {activity.activityType.replace(
                                                                    "_",
                                                                    " "
                                                                )}{" "}
                                                                completed
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {new Date(
                                                                    activity.timestamp
                                                                ).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-slate-500 text-sm">
                                                    No recent activities
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4 text-sm sm:text-base"
                                    >
                                        View All Activities
                                    </Button>
                                </div>
                            </div>

                            {/* Employee Overview Panel */}
                            <EmployeeOverview
                                totalEmployees={
                                    safeMetrics?.totalEmployees || 0
                                }
                                activeEmployees={
                                    safeMetrics?.activeEmployeesCount || 0
                                }
                            />

                            {/* Inventory Status Panel */}
                            <InventoryStatus
                                items={safeMetrics?.lowStockItems || []}
                            />
                        </TabsContent>

                        {/* Executive Dashboard Tab */}
                        {canViewExecutive && (
                            <TabsContent
                                value="executive"
                                className="space-y-6"
                            >
                                {activeTab === "executive" && kpiLoading ? (
                                    <div className="bg-white rounded-xl shadow-sm border p-6 text-sm text-slate-500">
                                        Loading executive KPIs...
                                    </div>
                                ) : (
                                    activeTab === "executive" && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="bg-white border rounded-lg p-4">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                                                    Revenue
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    ₦
                                                    {exec.revenue?.toLocaleString?.() ||
                                                        0}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Today
                                                </p>
                                            </div>
                                            <div className="bg-white border rounded-lg p-4">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                                                    Eggs Collected
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exec.eggs || 0}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Today
                                                </p>
                                            </div>
                                            <div className="bg-white border rounded-lg p-4">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                                                    Mortality Rate
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exec.mortalityRate?.toFixed?.(
                                                        2
                                                    ) || 0}
                                                    %
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Today
                                                </p>
                                            </div>
                                            <div className="bg-white border rounded-lg p-4">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                                                    Feed Conversion Ratio
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exec.fcr?.toFixed?.(2) ||
                                                        0}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Current
                                                </p>
                                            </div>
                                            <div className="bg-white border rounded-lg p-4">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                                                    Profit Margin
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exec.profitMargin?.toFixed?.(
                                                        2
                                                    ) || 0}
                                                    %
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Today
                                                </p>
                                            </div>
                                            <div className="bg-white border rounded-lg p-4">
                                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                                                    Alerts (Critical)
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {exec.alerts?.critical || 0}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Active
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </TabsContent>
                        )}

                        {/* Daily Operations Tab */}
                        <TabsContent value="operations" className="space-y-6">
                            {/* Daily Activity Recording Panel */}
                            <ActivityForms />

                            {/* Export and Reporting Panel */}
                            <ExportPanel />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
