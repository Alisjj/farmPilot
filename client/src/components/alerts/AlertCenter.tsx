import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertTriangle,
    Bell,
    Clock,
    MapPin,
    Check,
    X,
    Filter,
    RefreshCw,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertData,
    AlertSeverity,
    AlertType,
    ALERT_SEVERITY,
    ALERT_TYPES,
} from "@shared/types/alerts";

interface AlertCenterProps {
    showUnreadOnly?: boolean;
    maxHeight?: string;
}

export default function AlertCenter({
    showUnreadOnly = false,
    maxHeight = "400px",
}: AlertCenterProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">(
        "all"
    );
    const [filterType, setFilterType] = useState<AlertType | "all">("all");

    // Fetch alerts
    const {
        data: alerts,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: [
            "/api/alerts",
            { userId: user?.id, isRead: showUnreadOnly ? false : undefined },
        ],
        queryFn: () => apiRequest("/api/alerts"),
        enabled: !!user?.id,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Mark alert as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (alertId: string) =>
            apiRequest("POST", `/api/alerts/${alertId}/mark-read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        },
    });

    // Dismiss alert mutation (if needed)
    const dismissAlertMutation = useMutation({
        mutationFn: (alertId: string) =>
            apiRequest("DELETE", `/api/alerts/${alertId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        },
    });

    const handleMarkAsRead = (alertId: string) => {
        markAsReadMutation.mutate(alertId);
    };

    const handleDismissAlert = (alertId: string) => {
        dismissAlertMutation.mutate(alertId);
    };

    const getSeverityColor = (severity: AlertSeverity) => {
        switch (severity) {
            case "critical":
                return "bg-red-100 text-red-800 border-red-200";
            case "high":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "medium":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "low":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getSeverityIcon = (severity: AlertSeverity) => {
        switch (severity) {
            case "critical":
                return <AlertTriangle className="w-4 h-4 text-red-600" />;
            case "high":
                return <AlertTriangle className="w-4 h-4 text-orange-600" />;
            case "medium":
                return <Bell className="w-4 h-4 text-yellow-600" />;
            case "low":
                return <Bell className="w-4 h-4 text-blue-600" />;
            default:
                return <Bell className="w-4 h-4 text-gray-600" />;
        }
    };

    const getTypeIcon = (type: AlertType) => {
        switch (type) {
            case "threshold_exceeded":
                return <AlertTriangle className="w-4 h-4" />;
            case "deadline_missed":
                return <Clock className="w-4 h-4" />;
            case "equipment_failure":
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - new Date(date).getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    // Filter alerts based on selected criteria
    const filteredAlerts = (alerts || []).filter((alert: any) => {
        if (filterSeverity !== "all" && alert.severity !== filterSeverity)
            return false;
        if (filterType !== "all" && alert.type !== filterType) return false;
        return true;
    });

    const unreadCount = (alerts || []).filter(
        (alert: any) => !alert.isRead
    ).length;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-24">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Failed to load alerts. Please try again.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Alerts
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {unreadCount}
                            </Badge>
                        )}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                isLoading ? "animate-spin" : ""
                            }`}
                        />
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4">
                    <Select
                        value={filterSeverity}
                        onValueChange={(value) =>
                            setFilterSeverity(value as AlertSeverity | "all")
                        }
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            {Object.entries(ALERT_SEVERITY).map(
                                ([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filterType}
                        onValueChange={(value) =>
                            setFilterType(value as AlertType | "all")
                        }
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(ALERT_TYPES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent>
                <ScrollArea style={{ height: maxHeight }}>
                    {filteredAlerts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No alerts to display</p>
                            <p className="text-sm">
                                All systems running smoothly!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAlerts.map((alert: any) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded-lg border transition-all duration-200 ${
                                        !alert.isRead
                                            ? "bg-blue-50 border-blue-200 shadow-sm"
                                            : "bg-white border-gray-200"
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getSeverityIcon(
                                                    alert.severity
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge
                                                        className={getSeverityColor(
                                                            alert.severity
                                                        )}
                                                    >
                                                        {
                                                            ALERT_SEVERITY[
                                                                alert.severity as AlertSeverity
                                                            ]
                                                        }
                                                    </Badge>
                                                    {alert.farmSection && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="w-3 h-3" />
                                                            {alert.farmSection}
                                                        </div>
                                                    )}
                                                </div>

                                                <h4 className="font-medium text-sm mb-1">
                                                    {alert.title}
                                                </h4>

                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {alert.message}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimeAgo(
                                                            alert.createdAt
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {getTypeIcon(
                                                            alert.type
                                                        )}
                                                        {
                                                            ALERT_TYPES[
                                                                alert.type as AlertType
                                                            ]
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 ml-3">
                                            {!alert.isRead && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            alert.id
                                                        )
                                                    }
                                                    disabled={
                                                        markAsReadMutation.isPending
                                                    }
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleDismissAlert(alert.id)
                                                }
                                                disabled={
                                                    dismissAlertMutation.isPending
                                                }
                                                title="Dismiss alert"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
