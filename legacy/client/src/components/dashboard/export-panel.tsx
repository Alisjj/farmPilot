import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function ExportPanel() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [selectedReports, setSelectedReports] = useState<string[]>([
        "production",
    ]);
    const [exportFormat, setExportFormat] = useState("pdf");
    const [dateRange, setDateRange] = useState("today");

    const reportTypes = [
        { id: "production", label: "Daily Production Summary" },
        { id: "financial", label: "Financial Statement" },
        { id: "inventory", label: "Inventory Status" },
        { id: "employees", label: "Employee Records" },
        { id: "health", label: "Health & Mortality Analysis" },
    ];

    const recentExports = [
        { name: "Production_Report_Mar15.pdf", date: "March 15, 2024" },
        { name: "Inventory_Status_Mar14.csv", date: "March 14, 2024" },
        { name: "Financial_Summary_Mar13.xlsx", date: "March 13, 2024" },
    ];

    const handleReportToggle = (reportId: string) => {
        setSelectedReports((prev) =>
            prev.includes(reportId)
                ? prev.filter((id) => id !== reportId)
                : [...prev, reportId]
        );
    };

    const handleGenerateReport = async () => {
        if (selectedReports.length === 0) {
            toast({
                title: "Error",
                description: "Please select at least one report type",
                variant: "destructive",
            });
            return;
        }

        if (exportFormat !== "csv") {
            toast({
                title: "Not Implemented",
                description: "Only CSV is currently supported.",
            });
            return;
        }

        try {
            const res = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ types: selectedReports }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed");
            }
            const blob = await res.blob();
            const disposition = res.headers.get("Content-Disposition") || "";
            const match = disposition.match(/filename="?([^";]+)"?/i);
            const filename = match ? match[1] : "report.csv";
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast({ title: "Download Started", description: filename });
        } catch (e: any) {
            toast({
                title: "Generation Failed",
                description: e.message,
                variant: "destructive",
            });
        }
    };

    const handleScheduleReport = () => {
        if (user?.role !== "admin") {
            toast({
                title: "Forbidden",
                description: "Only admin can schedule reports",
                variant: "destructive",
            });
            return;
        }
        toast({
            title: "Coming Soon",
            description: "Scheduling will be available later.",
        });
    };

    return (
        <Card className="bg-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                        Reports & Data Export
                    </CardTitle>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={handleScheduleReport}
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Schedule Report
                        </Button>
                        <Button
                            onClick={handleGenerateReport}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Generate Report
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Report Types */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">
                            Available Reports
                        </h4>
                        <div className="space-y-2">
                            {reportTypes.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center space-x-3"
                                >
                                    <Checkbox
                                        id={report.id}
                                        checked={selectedReports.includes(
                                            report.id
                                        )}
                                        onCheckedChange={() =>
                                            handleReportToggle(report.id)
                                        }
                                    />
                                    <label
                                        htmlFor={report.id}
                                        className="text-sm text-slate-700 cursor-pointer"
                                    >
                                        {report.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">
                            Export Options
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Format
                                </label>
                                <Select
                                    value={exportFormat}
                                    onValueChange={setExportFormat}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">
                                            PDF (Presentation)
                                        </SelectItem>
                                        <SelectItem value="csv">
                                            CSV (Data Analysis)
                                        </SelectItem>
                                        <SelectItem value="excel" disabled>
                                            Excel (Detailed)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Date Range
                                </label>
                                <Select
                                    value={dateRange}
                                    onValueChange={setDateRange}
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
                                        <SelectItem value="custom">
                                            Custom Range
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Recent Exports */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">
                            Recent Exports
                        </h4>
                        <div className="space-y-3">
                            {recentExports.map((exportItem, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {exportItem.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {exportItem.date}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
