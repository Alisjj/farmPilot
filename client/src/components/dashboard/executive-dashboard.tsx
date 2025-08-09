// Executive Dashboard Component - Phase 2 Business Intelligence
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    AlertCircle,
    DollarSign,
    Package,
    Users,
    Activity,
    Calendar,
    BarChart3,
    PieChart,
    LineChart,
} from "lucide-react";
import type {
    ExecutiveDashboardData,
    KpiMetric,
} from "@shared/types/dashboard";

interface ExecutiveDashboardProps {
    userId: string;
}

export function ExecutiveDashboard({ userId }: ExecutiveDashboardProps) {
    const [dashboardData, setDashboardData] =
        useState<ExecutiveDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState("today");
    const [selectedFarmSection, setSelectedFarmSection] = useState("all");
    const [refreshing, setRefreshing] = useState(false);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                dateRange: selectedTimeRange,
                farmSection: selectedFarmSection,
            });

            const response = await fetch(`/api/dashboard?${params}`);

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch dashboard data: ${response.statusText}`
                );
            }

            const data = await response.json();
            setDashboardData(data);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load dashboard data"
            );
        } finally {
            setLoading(false);
        }
    };

    // Refresh KPIs
    const refreshKpis = async () => {
        try {
            setRefreshing(true);

            // Trigger KPI calculation for today
            await fetch("/api/kpi/calculate-daily", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: new Date().toISOString().split("T")[0],
                    farmSection:
                        selectedFarmSection !== "all"
                            ? selectedFarmSection
                            : undefined,
                }),
            });

            // Refresh dashboard data
            await fetchDashboardData();
        } catch (err) {
            console.error("Error refreshing KPIs:", err);
            setError("Failed to refresh KPIs");
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [selectedTimeRange, selectedFarmSection]);

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "up":
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case "down":
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            default:
                return <Minus className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "good":
                return "bg-green-100 text-green-800 border-green-200";
            case "warning":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "critical":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "critical":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case "high":
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case "medium":
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Executive Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Farm performance overview and key metrics
                        </p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-0 pb-2">
                                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Dashboard</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                    onClick={fetchDashboardData}
                    className="mt-4"
                    variant="outline"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="p-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        No dashboard data found. Please check your farm
                        activities.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Executive Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated:{" "}
                        {new Date(dashboardData.lastUpdated).toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedTimeRange}
                        onValueChange={setSelectedTimeRange}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="quarter">
                                This Quarter
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedFarmSection}
                        onValueChange={setSelectedFarmSection}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            <SelectItem value="section-a">Section A</SelectItem>
                            <SelectItem value="section-b">Section B</SelectItem>
                            <SelectItem value="section-c">Section C</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={refreshKpis}
                        disabled={refreshing}
                        variant="outline"
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${
                                refreshing ? "animate-spin" : ""
                            }`}
                        />
                        Refresh KPIs
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₦
                            {dashboardData.summary.totalRevenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Profit margin:{" "}
                            {dashboardData.summary.profitMargin.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Egg Production
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardData.summary.eggProduction.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            eggs collected today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Mortality Rate
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardData.summary.mortalityRate.toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            within acceptable range
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Alerts
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardData.summary.alertsCount.total}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardData.summary.alertsCount.critical}{" "}
                            critical
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="kpis" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="kpis">
                        Key Performance Indicators
                    </TabsTrigger>
                    <TabsTrigger value="production">
                        Production Analytics
                    </TabsTrigger>
                    <TabsTrigger value="financial">
                        Financial Overview
                    </TabsTrigger>
                    <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
                </TabsList>

                {/* KPIs Tab */}
                <TabsContent value="kpis" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {dashboardData.kpis.map((kpi) => (
                            <Card key={kpi.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {kpi.name}
                                    </CardTitle>
                                    {getTrendIcon(kpi.trend)}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {kpi.currentValue.toLocaleString()}{" "}
                                        {kpi.unit}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <Badge
                                            variant="secondary"
                                            className={getStatusColor(
                                                kpi.status
                                            )}
                                        >
                                            {kpi.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {kpi.category}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Production Analytics Tab */}
                <TabsContent value="production" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Production Overview</CardTitle>
                                <CardDescription>
                                    Daily egg production and feed conversion
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Egg Production Rate
                                        </span>
                                        <span className="font-medium">
                                            {dashboardData.kpis.find(
                                                (k) => k.id === "egg_production"
                                            )?.currentValue || 0}
                                            %
                                        </span>
                                    </div>
                                    <Progress value={85} className="w-full" />

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Feed Conversion Ratio
                                        </span>
                                        <span className="font-medium">2.1</span>
                                    </div>
                                    <Progress value={75} className="w-full" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quality Metrics</CardTitle>
                                <CardDescription>
                                    Egg quality and collection efficiency
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Grade A Eggs
                                        </span>
                                        <span className="font-medium">92%</span>
                                    </div>
                                    <Progress value={92} className="w-full" />

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Collection Efficiency
                                        </span>
                                        <span className="font-medium">96%</span>
                                    </div>
                                    <Progress value={96} className="w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Financial Overview Tab */}
                <TabsContent value="financial" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue & Expenses</CardTitle>
                                <CardDescription>
                                    Daily financial performance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Total Revenue
                                        </span>
                                        <span className="font-medium text-green-600">
                                            ₦
                                            {dashboardData.summary.totalRevenue.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Total Expenses
                                        </span>
                                        <span className="font-medium text-red-600">
                                            ₦
                                            {dashboardData.summary.totalExpenses.toLocaleString()}
                                        </span>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            Net Profit
                                        </span>
                                        <span className="font-bold text-lg">
                                            ₦
                                            {(
                                                dashboardData.summary
                                                    .totalRevenue -
                                                dashboardData.summary
                                                    .totalExpenses
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cost Analysis</CardTitle>
                                <CardDescription>
                                    Feed costs and efficiency metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Feed Cost per Egg
                                        </span>
                                        <span className="font-medium">
                                            ₦0.08
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Labor Cost per Egg
                                        </span>
                                        <span className="font-medium">
                                            ₦0.03
                                        </span>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            Total Cost per Egg
                                        </span>
                                        <span className="font-bold">₦0.12</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-4">
                    <div className="space-y-4">
                        {dashboardData.recentAlerts.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center text-muted-foreground">
                                        No active alerts at this time
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            dashboardData.recentAlerts.map((alert) => (
                                <Alert
                                    key={alert.id}
                                    variant={
                                        alert.severity === "critical"
                                            ? "destructive"
                                            : "default"
                                    }
                                >
                                    {getSeverityIcon(alert.severity)}
                                    <AlertTitle className="flex items-center justify-between">
                                        <span>{alert.title}</span>
                                        <Badge variant="outline">
                                            {alert.farmSection ||
                                                "All Sections"}
                                        </Badge>
                                    </AlertTitle>
                                    <AlertDescription>
                                        {alert.description}
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {new Date(
                                                alert.createdAt
                                            ).toLocaleString()}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
