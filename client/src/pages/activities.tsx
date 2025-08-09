import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import EggCollectionForm from "@/components/activities/EggCollectionForm";
import MortalityForm from "@/components/activities/MortalityForm";
import FeedDistributionForm from "@/components/activities/FeedDistributionForm";
import AlertCenter from "@/components/alerts/AlertCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Calendar,
    Search,
    Filter,
    Plus,
    User,
    CheckCircle,
    AlertTriangle,
    Bell,
} from "lucide-react";
import {
    ActivityType,
    ACTIVITY_TYPES,
    EggCollectionData,
    MortalityData,
    FeedDistributionData,
} from "@shared/types/activities";

export default function Activities() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading, user } = useAuth();
    const queryClient = useQueryClient();
    const [activityType, setActivityType] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    // Separate dialog states to avoid multiple Radix Dialog components sharing one state
    const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
    const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] =
        useState(false);
    const [selectedActivityType, setSelectedActivityType] =
        useState<ActivityType | null>(null);
    const [newActivity, setNewActivity] = useState({
        activityType: "",
        location: "",
        notes: "",
        assignedTo: "", // For task assignment
    });

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
        data: activities,
        isLoading: activitiesLoading,
        error,
    } = useQuery({
        queryKey: [
            "/api/activities",
            { type: activityType !== "all" ? activityType : undefined },
        ],
        queryFn: () => apiRequest("/api/activities"),
        enabled: isAuthenticated,
    });

    // Get employees for task assignment
    const { data: employees } = useQuery({
        queryKey: ["/api/employees"],
        queryFn: () => apiRequest("/api/employees"),
        enabled: isAuthenticated,
    });

    // Mutation for creating new activities/tasks with enhanced validation
    const addActivityMutation = useMutation({
        mutationFn: async (activityData: any) => {
            await apiRequest("POST", "/api/activities/validate", activityData);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Activity created successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
            setIsActivityFormOpen(false);
            setIsNewActivityDialogOpen(false);
            setNewActivity({
                activityType: "",
                location: "",
                notes: "",
                assignedTo: "",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create activity",
                variant: "destructive",
            });
        },
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

    if (isLoading || activitiesLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading activities...</p>
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

    // Type-safe activities access
    const safeActivities = (activities || []) as any[];
    const safeEmployees = (employees || []) as any[];

    const filteredActivities = safeActivities.filter(
        (activity: any) =>
            searchTerm === "" ||
            activity.activityType
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            activity.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddActivity = () => {
        if (!newActivity.activityType || !newActivity.location) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        const activityData = {
            ...newActivity,
            userId: newActivity.assignedTo || user?.id, // Assign to selected user or current user
            data: {}, // Empty data object for now
        };

        addActivityMutation.mutate(activityData);
    };

    // Enhanced form handlers
    const handleEggCollectionSubmit = (data: EggCollectionData) => {
        const activityData = {
            activityType: "egg_collection",
            location: data.coopLocation,
            farmSection: data.coopLocation,
            data: data,
            notes: "", // Notes are handled separately in the form
            status: "completed",
            priority: "normal",
        };

        addActivityMutation.mutate(activityData);
    };

    const handleMortalitySubmit = (data: MortalityData) => {
        const activityData = {
            activityType: "mortality",
            location: data.affectedCoop,
            farmSection: data.affectedCoop,
            data: data,
            notes: "", // Notes are handled separately in the form
            status: "completed",
            priority: data.count >= 5 ? "critical" : "normal", // Auto-set priority based on count
        };

        addActivityMutation.mutate(activityData);
    };

    const handleFeedDistributionSubmit = (
        data: FeedDistributionData & {
            targetSection: string;
            birdCount: number;
        }
    ) => {
        const { targetSection, birdCount, ...rest } = data;
        const activityData = {
            activityType: "feed_distribution",
            location: targetSection,
            farmSection: targetSection,
            data: { ...rest, targetSection, birdCount },
            notes: "",
            status: "completed",
            priority: "normal",
        };
        addActivityMutation.mutate(activityData);
    };

    const handleActivityTypeSelect = (type: ActivityType) => {
        setSelectedActivityType(type);
        setIsActivityFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsActivityFormOpen(false);
        setSelectedActivityType(null);
    };

    const renderActivityForm = () => {
        switch (selectedActivityType) {
            case "egg_collection":
                return (
                    <EggCollectionForm
                        onSubmit={handleEggCollectionSubmit}
                        onCancel={handleCloseForm}
                        isLoading={addActivityMutation.isPending}
                    />
                );
            case "mortality":
                return (
                    <MortalityForm
                        onSubmit={handleMortalitySubmit}
                        onCancel={handleCloseForm}
                        isLoading={addActivityMutation.isPending}
                        totalFlockSize={1000} // This should come from farm settings
                    />
                );
            case "feed_distribution":
                return (
                    <FeedDistributionForm
                        onSubmit={handleFeedDistributionSubmit}
                        onCancel={handleCloseForm}
                        isLoading={addActivityMutation.isPending}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <main className="flex-1 lg:ml-64 ml-0 min-w-0">
                <TopHeader
                    title="Daily Activities"
                    subtitle="Track and monitor all farm operations and activities"
                />

                <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
                    {/* Alert Center */}
                    <AlertCenter maxHeight="300px" />

                    {/* Enhanced Activity Type Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Quick Activity Entry
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Select an activity type to record with
                                structured data capture
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Button
                                    data-cy="btn-activity-egg_collection"
                                    variant="outline"
                                    className="h-20 flex-col gap-2"
                                    onClick={() =>
                                        handleActivityTypeSelect(
                                            "egg_collection"
                                        )
                                    }
                                >
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        🥚
                                    </div>
                                    <span className="text-xs">
                                        Egg Collection
                                    </span>
                                </Button>
                                <Button
                                    data-cy="btn-activity-mortality"
                                    variant="outline"
                                    className="h-20 flex-col gap-2"
                                    onClick={() =>
                                        handleActivityTypeSelect("mortality")
                                    }
                                >
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                        ❤️‍🩹
                                    </div>
                                    <span className="text-xs">
                                        Mortality Check
                                    </span>
                                </Button>
                                <Button
                                    data-cy="btn-activity-feed_distribution"
                                    variant="outline"
                                    className="h-20 flex-col gap-2"
                                    onClick={() =>
                                        handleActivityTypeSelect(
                                            "feed_distribution"
                                        )
                                    }
                                >
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        🌾
                                    </div>
                                    <span className="text-xs">
                                        Feed Distribution
                                    </span>
                                </Button>
                                <Button
                                    data-cy="btn-activity-medication"
                                    variant="outline"
                                    className="h-20 flex-col gap-2"
                                    onClick={() =>
                                        handleActivityTypeSelect("medication")
                                    }
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        💊
                                    </div>
                                    <span className="text-xs">Medication</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Form Dialog */}
                    <Dialog
                        open={isActivityFormOpen}
                        onOpenChange={setIsActivityFormOpen}
                    >
                        <DialogContent
                            data-cy="activity-form-dialog"
                            data-selected-activity-type={
                                selectedActivityType || "none"
                            }
                            className="max-w-4xl max-h-[90vh] overflow-y-auto"
                        >
                            {renderActivityForm()}
                        </DialogContent>
                    </Dialog>

                    {/* Filters and Search */}
                    <Card>
                        <CardHeader className="pb-3 sm:pb-6">
                            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <span className="text-lg sm:text-xl">
                                    Activity Log
                                </span>
                                <Dialog
                                    open={isNewActivityDialogOpen}
                                    onOpenChange={setIsNewActivityDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Activity
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xs sm:max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                                        {/* data attribute for simpler test targeting */}
                                        <div data-cy="new-activity-dialog" />
                                        <DialogHeader>
                                            <DialogTitle className="text-lg sm:text-xl">
                                                Create New Activity
                                            </DialogTitle>
                                            <DialogDescription className="text-sm sm:text-base">
                                                Create a new farm activity or
                                                assign a task to an employee.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <Label htmlFor="activityType">
                                                    Activity Type *
                                                </Label>
                                                <Select
                                                    value={
                                                        newActivity.activityType
                                                    }
                                                    onValueChange={(value) =>
                                                        setNewActivity({
                                                            ...newActivity,
                                                            activityType: value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select activity type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="egg_collection">
                                                            Egg Collection
                                                        </SelectItem>
                                                        <SelectItem value="feed_distribution">
                                                            Feed Distribution
                                                        </SelectItem>
                                                        <SelectItem value="mortality">
                                                            Mortality Check
                                                        </SelectItem>
                                                        <SelectItem value="medication">
                                                            Medication
                                                        </SelectItem>
                                                        <SelectItem value="water_consumption">
                                                            Water Consumption
                                                        </SelectItem>
                                                        <SelectItem value="egg_sales">
                                                            Egg Sales
                                                        </SelectItem>
                                                        <SelectItem value="cleaning">
                                                            Cleaning
                                                        </SelectItem>
                                                        <SelectItem value="maintenance">
                                                            Maintenance
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="location">
                                                    Location *
                                                </Label>
                                                <Input
                                                    id="location"
                                                    value={newActivity.location}
                                                    onChange={(e) =>
                                                        setNewActivity({
                                                            ...newActivity,
                                                            location:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Coop A, Building 1, etc."
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="assignedTo">
                                                    Assign To
                                                </Label>
                                                <Select
                                                    value={
                                                        newActivity.assignedTo ||
                                                        undefined
                                                    }
                                                    onValueChange={(value) =>
                                                        setNewActivity({
                                                            ...newActivity,
                                                            assignedTo:
                                                                value === "self"
                                                                    ? ""
                                                                    : value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Assign to employee (optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="self">
                                                            Self-assigned
                                                        </SelectItem>
                                                        {safeEmployees.map(
                                                            (employee: any) => (
                                                                <SelectItem
                                                                    key={
                                                                        employee.id
                                                                    }
                                                                    value={
                                                                        employee.id
                                                                    }
                                                                >
                                                                    {
                                                                        employee.firstName
                                                                    }{" "}
                                                                    {
                                                                        employee.lastName
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        employee.role
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="notes">
                                                    Notes
                                                </Label>
                                                <Textarea
                                                    id="notes"
                                                    value={newActivity.notes}
                                                    onChange={(e) =>
                                                        setNewActivity({
                                                            ...newActivity,
                                                            notes: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Additional instructions or notes..."
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2 mt-6">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setIsNewActivityDialogOpen(
                                                        false
                                                    )
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddActivity}
                                                disabled={
                                                    addActivityMutation.isPending
                                                }
                                                className="bg-primary hover:bg-primary/90"
                                            >
                                                {addActivityMutation.isPending
                                                    ? "Creating..."
                                                    : "Create Activity"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search activities..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="pl-10 h-10 sm:h-11"
                                        />
                                    </div>
                                </div>
                                <Select
                                    value={activityType}
                                    onValueChange={setActivityType}
                                >
                                    <SelectTrigger className="w-full sm:w-48 h-10 sm:h-11">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Activities
                                        </SelectItem>
                                        <SelectItem value="egg_collection">
                                            Egg Collection
                                        </SelectItem>
                                        <SelectItem value="feed_distribution">
                                            Feed Distribution
                                        </SelectItem>
                                        <SelectItem value="mortality">
                                            Mortality
                                        </SelectItem>
                                        <SelectItem value="medication">
                                            Medication
                                        </SelectItem>
                                        <SelectItem value="water_consumption">
                                            Water Consumption
                                        </SelectItem>
                                        <SelectItem value="egg_sales">
                                            Egg Sales
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Date Range
                                </Button>
                            </div>

                            {/* Activities Table */}
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[120px]">
                                                Activity Type
                                            </TableHead>
                                            <TableHead className="min-w-[100px] hidden sm:table-cell">
                                                Location
                                            </TableHead>
                                            <TableHead className="min-w-[120px] hidden md:table-cell">
                                                Assigned To
                                            </TableHead>
                                            <TableHead className="min-w-[140px]">
                                                Date & Time
                                            </TableHead>
                                            <TableHead className="min-w-[120px] hidden lg:table-cell">
                                                Notes
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredActivities.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center py-8"
                                                >
                                                    <div className="text-slate-500">
                                                        <Calendar className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                                                        <p className="text-sm sm:text-base">
                                                            No activities found
                                                        </p>
                                                        <p className="text-xs sm:text-sm">
                                                            Try adjusting your
                                                            filters or create a
                                                            new activity
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredActivities.map(
                                                (activity: any) => (
                                                    <TableRow key={activity.id}>
                                                        <TableCell>
                                                            <Badge
                                                                className={`${getActivityTypeColor(
                                                                    activity.activityType
                                                                )} text-xs`}
                                                            >
                                                                {formatActivityType(
                                                                    activity.activityType
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">
                                                            <span className="text-slate-600 text-sm">
                                                                {activity.location ||
                                                                    "Not specified"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="flex items-center space-x-2">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                                <span className="text-sm">
                                                                    {/* Show assigned employee name if available */}
                                                                    {safeEmployees.find(
                                                                        (
                                                                            emp: any
                                                                        ) =>
                                                                            emp.id ===
                                                                            activity.userId
                                                                    )
                                                                        ?.firstName ||
                                                                        "Unknown"}{" "}
                                                                    {safeEmployees.find(
                                                                        (
                                                                            emp: any
                                                                        ) =>
                                                                            emp.id ===
                                                                            activity.userId
                                                                    )
                                                                        ?.lastName ||
                                                                        "User"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {new Date(
                                                                        activity.timestamp
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {new Date(
                                                                        activity.timestamp
                                                                    ).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell">
                                                            <span className="text-slate-600 text-sm">
                                                                {activity.notes &&
                                                                activity.notes
                                                                    .length > 0
                                                                    ? activity
                                                                          .notes
                                                                          .length >
                                                                      50
                                                                        ? `${activity.notes.substring(
                                                                              0,
                                                                              50
                                                                          )}...`
                                                                        : activity.notes
                                                                    : "-"}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )
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
