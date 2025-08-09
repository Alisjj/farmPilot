import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Download,
    TrendingUp,
    BarChart3,
    PieChart,
    Calendar,
    DollarSign,
    Egg,
    AlertTriangle,
} from "lucide-react";

export default function Reports() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading } = useAuth();
    const [reportType, setReportType] = useState("production");
    const [timeRange, setTimeRange] = useState("month");

    // Redirect to home if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
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

    const {
        data: reportData,
        isLoading: reportsLoading,
        error,
    } = useQuery({
        queryKey: ["/api/reports", reportType, timeRange],
        enabled: isAuthenticated,
    });

    useEffect(() => {
        if (error && isUnauthorizedError(error as Error)) {
            toast({
                title: "Unauthorized",
                description: "You are logged out. Logging in again...",
                variant: "destructive",
            });
            setTimeout(() => {
                window.location.href = "/api/login";
            }, 500);
        }
    }, [error, toast]);

    if (isLoading || reportsLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    const reports = [
        {
            id: "production",
            title: "Production Report",
            description:
                "Egg collection, feed consumption, and mortality analysis",
            icon: Egg,
            metrics: [
                "Total Eggs: 12,450",
                "Feed Used: 2.8 tons",
                "Mortality: 0.8%",
            ],
            color: "bg-primary/5 border-primary/20",
            iconColor: "text-primary",
        },
        {
            id: "financial",
            title: "Financial Report",
            description: "Revenue, expenses, and profitability analysis",
            icon: DollarSign,
            metrics: ["Revenue: ₦8,450", "Expenses: ₦6,200", "Profit: ₦2,250"],
            color: "bg-success/5 border-success/20",
            iconColor: "text-success",
        },
        {
            id: "inventory",
            title: "Inventory Report",
            description: "Stock levels, usage patterns, and procurement needs",
            icon: BarChart3,
            metrics: ["Items in Stock: 45", "Low Stock: 8", "Expired: 2"],
            color: "bg-warning/5 border-warning/20",
            iconColor: "text-warning",
        },
        {
            id: "health",
            title: "Health Report",
            description:
                "Veterinary records, treatments, and flock health status",
            icon: AlertTriangle,
            metrics: [
                "Health Records: 28",
                "Active Treatments: 3",
                "Alerts: 1",
            ],
            color: "bg-accent/5 border-accent/20",
            iconColor: "text-accent",
        },
    ];

    const handleGenerateReport = (reportId: string) => {
        toast({
            title: "Report Generated",
            description: `${reportId} report has been generated and is ready for download`,
        });
    };

    const handleDownloadReport = (reportId: string) => {
        toast({
            title: "Download Started",
            description: `Downloading ${reportId} report...`,
        });
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <main className="flex-1 lg:ml-64 ml-0">
                <TopHeader
                    title="Reports & Analytics"
                    subtitle="Generate comprehensive reports and analyze farm performance"
                />

                <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
                    {/* Report Controls */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FileText className="w-5 h-5" />
                                <span>Report Generator</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Report Type
                                    </label>
                                    <Select
                                        value={reportType}
                                        onValueChange={setReportType}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="production">
                                                Production Report
                                            </SelectItem>
                                            <SelectItem value="financial">
                                                Financial Report
                                            </SelectItem>
                                            <SelectItem value="inventory">
                                                Inventory Report
                                            </SelectItem>
                                            <SelectItem value="health">
                                                Health Report
                                            </SelectItem>
                                            <SelectItem value="comprehensive">
                                                Comprehensive Report
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Time Range
                                    </label>
                                    <Select
                                        value={timeRange}
                                        onValueChange={setTimeRange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">
                                                Today
                                            </SelectItem>
                                            <SelectItem value="week">
                                                Last 7 Days
                                            </SelectItem>
                                            <SelectItem value="month">
                                                Last 30 Days
                                            </SelectItem>
                                            <SelectItem value="quarter">
                                                Last Quarter
                                            </SelectItem>
                                            <SelectItem value="year">
                                                Last Year
                                            </SelectItem>
                                            <SelectItem value="custom">
                                                Custom Range
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={() =>
                                        handleGenerateReport(reportType)
                                    }
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Generate Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Available Reports */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                        {reports.map((report) => {
                            const IconComponent = report.icon;
                            return (
                                <Card
                                    key={report.id}
                                    className={`${report.color} hover:shadow-md transition-shadow`}
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <IconComponent
                                                    className={`w-6 h-6 ${report.iconColor}`}
                                                />
                                                <span>{report.title}</span>
                                            </div>
                                            <Badge variant="secondary">
                                                Available
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600 mb-4">
                                            {report.description}
                                        </p>

                                        <div className="space-y-2 mb-4">
                                            {report.metrics.map(
                                                (metric, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center text-sm"
                                                    >
                                                        <TrendingUp className="w-3 h-3 mr-2 text-slate-400" />
                                                        <span className="text-slate-600">
                                                            {metric}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleGenerateReport(
                                                        report.id
                                                    )
                                                }
                                                className="flex-1"
                                            >
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                Generate
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleDownloadReport(
                                                        report.id
                                                    )
                                                }
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Quick Analytics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <PieChart className="w-5 h-5" />
                                <span>Quick Analytics</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
                                <div className="text-center p-4 bg-primary/5 rounded-lg">
                                    <Egg className="w-8 h-8 text-primary mx-auto mb-2" />
                                    <h3 className="text-xl font-bold text-slate-900">
                                        98.2%
                                    </h3>
                                    <p className="text-slate-600">
                                        Production Efficiency
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-success/5 rounded-lg">
                                    <DollarSign className="w-8 h-8 text-success mx-auto mb-2" />
                                    <h3 className="text-xl font-bold text-slate-900">
                                        ₦2,250
                                    </h3>
                                    <p className="text-slate-600">
                                        Monthly Profit
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-warning/5 rounded-lg">
                                    <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
                                    <h3 className="text-xl font-bold text-slate-900">
                                        99.2%
                                    </h3>
                                    <p className="text-slate-600">
                                        Flock Health Score
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Report History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Calendar className="w-5 h-5" />
                                <span>Recent Reports</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    {
                                        name: "Monthly Production Report",
                                        date: "Generated today",
                                        type: "PDF",
                                    },
                                    {
                                        name: "Financial Summary - Q1",
                                        date: "Generated 2 days ago",
                                        type: "Excel",
                                    },
                                    {
                                        name: "Inventory Status Report",
                                        date: "Generated 1 week ago",
                                        type: "CSV",
                                    },
                                    {
                                        name: "Health & Veterinary Report",
                                        date: "Generated 2 weeks ago",
                                        type: "PDF",
                                    },
                                ].map((report, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {report.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {report.date}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="outline">
                                                {report.type}
                                            </Badge>
                                            <Button variant="ghost" size="sm">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
