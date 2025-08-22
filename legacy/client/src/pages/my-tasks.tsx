import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, Calendar, MapPin, FileText } from "lucide-react";

export default function MyTasks() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading, user } = useAuth();
    const queryClient = useQueryClient();

    // Redirect to home if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            toast({
                title: "Unauthorized",
                description: "Please log in to view your tasks",
                variant: "destructive",
            });
            setTimeout(() => {
                window.location.href = "/login";
            }, 500);
            return;
        }
    }, [isAuthenticated, isLoading, toast]);

    // Get user's assigned activities/tasks
    const {
        data: myTasks,
        isLoading: tasksLoading,
        error,
    } = useQuery({
        queryKey: ["/api/activities", { userId: user?.id }],
        queryFn: () => apiRequest(`/api/activities?userId=${user?.id}`),
        enabled: isAuthenticated && !!user?.id,
    });

    const markCompletedMutation = useMutation({
        mutationFn: async (taskId: string) => {
            await apiRequest("PUT", `/api/activities/${taskId}`, {
                status: "completed",
            });
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Task marked as completed",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update task",
                variant: "destructive",
            });
        },
    });

    if (isLoading || tasksLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your tasks...</p>
                </div>
            </div>
        );
    }

    const getActivityTypeColor = (type: string) => {
        switch (type) {
            case "egg_collection":
                return "bg-primary/10 text-primary";
            case "feed_distribution":
                return "bg-secondary/10 text-secondary";
            case "mortality":
                return "bg-accent/10 text-accent";
            case "medication":
                return "bg-warning/10 text-warning";
            case "water_consumption":
                return "bg-blue-100 text-blue-700";
            case "egg_sales":
                return "bg-success/10 text-success";
            case "cleaning":
                return "bg-purple-100 text-purple-700";
            case "maintenance":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    const formatActivityType = (type: string) => {
        return type
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-success/10 text-success";
            case "in_progress":
                return "bg-warning/10 text-warning";
            case "pending":
                return "bg-slate-100 text-slate-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    // Type-safe tasks access
    const safeTasks = (myTasks || []) as any[];
    const pendingTasks = safeTasks.filter(
        (task) => !task.status || task.status === "pending"
    );
    const completedTasks = safeTasks.filter(
        (task) => task.status === "completed"
    );

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <main className="flex-1 lg:ml-64 ml-0 min-w-0">
                <TopHeader
                    title="My Tasks"
                    subtitle={`Welcome back, ${
                        user?.firstName || "User"
                    }! Here are your assigned tasks.`}
                />

                <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
                        <Card className="border-warning/20 bg-warning/5">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center space-x-3">
                                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                            {pendingTasks.length}
                                        </h3>
                                        <p className="text-sm sm:text-base text-slate-600">
                                            Pending Tasks
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-success/20 bg-success/5">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center space-x-3">
                                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                            {completedTasks.length}
                                        </h3>
                                        <p className="text-sm sm:text-base text-slate-600">
                                            Completed
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                            {safeTasks.length}
                                        </h3>
                                        <p className="text-sm sm:text-base text-slate-600">
                                            Total Tasks
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tasks Table */}
                    <Card>
                        <CardHeader className="pb-3 sm:pb-6">
                            <CardTitle className="text-lg sm:text-xl">
                                Your Assigned Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[120px]">
                                                Task Type
                                            </TableHead>
                                            <TableHead className="min-w-[100px] hidden sm:table-cell">
                                                Location
                                            </TableHead>
                                            <TableHead className="min-w-[140px]">
                                                Assigned Date
                                            </TableHead>
                                            <TableHead className="min-w-[100px] hidden md:table-cell">
                                                Status
                                            </TableHead>
                                            <TableHead className="min-w-[120px] hidden lg:table-cell">
                                                Notes
                                            </TableHead>
                                            <TableHead className="min-w-[100px]">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeTasks.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-center py-8"
                                                >
                                                    <div className="text-slate-500">
                                                        <Calendar className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                                                        <p className="text-sm sm:text-base">
                                                            No tasks assigned
                                                            yet
                                                        </p>
                                                        <p className="text-xs sm:text-sm">
                                                            Your supervisor will
                                                            assign tasks to you
                                                            soon
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            safeTasks.map((task: any) => (
                                                <TableRow key={task.id}>
                                                    <TableCell>
                                                        <Badge
                                                            className={`${getActivityTypeColor(
                                                                task.activityType
                                                            )} text-xs`}
                                                        >
                                                            {formatActivityType(
                                                                task.activityType
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <div className="flex items-center space-x-2">
                                                            <MapPin className="w-4 h-4 text-slate-400" />
                                                            <span className="text-sm">
                                                                {task.location ||
                                                                    "Not specified"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {new Date(
                                                                    task.timestamp
                                                                ).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {new Date(
                                                                    task.timestamp
                                                                ).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <Badge
                                                            className={`${getStatusColor(
                                                                task.status ||
                                                                    "pending"
                                                            )} text-xs`}
                                                        >
                                                            {task.status ||
                                                                "pending"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="w-4 h-4 text-slate-400" />
                                                            <span className="text-sm">
                                                                {task.notes &&
                                                                task.notes
                                                                    .length > 0
                                                                    ? task.notes
                                                                          .length >
                                                                      40
                                                                        ? `${task.notes.substring(
                                                                              0,
                                                                              40
                                                                          )}...`
                                                                        : task.notes
                                                                    : "No notes"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(!task.status ||
                                                            task.status ===
                                                                "pending") && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    markCompletedMutation.mutate(
                                                                        task.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    markCompletedMutation.isPending
                                                                }
                                                                className="bg-success hover:bg-success/90"
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Complete
                                                            </Button>
                                                        )}
                                                        {task.status ===
                                                            "completed" && (
                                                            <Badge className="bg-success/10 text-success text-xs">
                                                                ✓ Done
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
