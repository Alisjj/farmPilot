import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Search, Filter, Plus, Users, UserCheck, UserX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Employee role enum (staff & admin)
enum EmployeeRole {
    STAFF = "staff",
    ADMIN = "admin",
}

export default function Employees() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading, user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [sortBy, setSortBy] = useState<string>("firstName");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [newEmployee, setNewEmployee] = useState({
        employeeId: "",
        firstName: "",
        lastName: "",
        role: EmployeeRole.STAFF,
        department: undefined as string | undefined,
        employmentType: "full_time",
        baseSalary: "0",
        payGrade: "A",
        status: "active",
        email: "",
        phone: "",
        address: "",
    });

    const isAdmin = user?.role === "admin";

    const {
        data: employees,
        isLoading: employeesLoading,
        error,
    } = useQuery({
        queryKey: ["/api/employees"],
        queryFn: () => apiRequest("/api/employees"),
        enabled: isAuthenticated,
    });

    const { data: activeEmployees } = useQuery({
        queryKey: ["/api/employees/active"],
        queryFn: () => apiRequest("/api/employees/active"),
        enabled: isAuthenticated,
    });

    // Type-safe employees access
    const safeEmployees = (employees || []) as any[];
    const safeActiveEmployees = (activeEmployees || []) as any[];

    // Sorting + filtering combined memo (must be before any conditional returns)
    const filteredEmployees = useMemo(() => {
        const base = safeEmployees.filter((employee: any) => {
            const matchesSearch =
                searchTerm === "" ||
                employee.firstName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                employee.lastName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                employee.employeeId
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                employee.role?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || employee.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
        const dir = sortDir === "asc" ? 1 : -1;
        return base.sort((a: any, b: any) => {
            const av = a[sortBy] ?? "";
            const bv = b[sortBy] ?? "";
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
    }, [safeEmployees, searchTerm, statusFilter, sortBy, sortDir]);

    const addEmployeeMutation = useMutation({
        mutationFn: async (employeeData: any) => {
            await apiRequest("POST", "/api/employees", employeeData);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Employee added successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
            setIsAddDialogOpen(false);
            setNewEmployee({
                employeeId: "",
                firstName: "",
                lastName: "",
                role: EmployeeRole.STAFF,
                department: undefined,
                employmentType: "full_time",
                baseSalary: "0",
                payGrade: "A",
                status: "active",
                email: "",
                phone: "",
                address: "",
            });
        },
        onError: (error: any) => {
            console.error("Employee creation error:", error);

            // Handle specific error cases
            if (error.response?.status === 409) {
                const errorData = error.response.data;
                if (errorData.field === "employeeId") {
                    toast({
                        title: "Duplicate Employee ID",
                        description:
                            errorData.message ||
                            "This Employee ID already exists. Please use a different ID.",
                        variant: "destructive",
                    });
                } else if (errorData.field === "email") {
                    toast({
                        title: "Duplicate Email",
                        description:
                            errorData.message ||
                            "This email address is already in use.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error",
                        description:
                            errorData.message || "Failed to create employee",
                        variant: "destructive",
                    });
                }
            } else {
                toast({
                    title: "Error",
                    description: error.message || "Failed to create employee",
                    variant: "destructive",
                });
            }
        },
    });

    const updateEmployeeMutation = useMutation({
        mutationFn: async (payload: { id: string; updates: any }) => {
            return apiRequest(
                "PUT",
                `/api/employees/${payload.id}`,
                payload.updates
            );
        },
        onSuccess: () => {
            toast({ title: "Updated", description: "Employee updated" });
            queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
            setIsEditDialogOpen(false);
            setSelectedEmployee(null);
        },
        onError: (e: any) => {
            toast({
                title: "Error",
                description: e.message || "Update failed",
                variant: "destructive",
            });
        },
    });

    const createStaffMutation = useMutation({
        mutationFn: async (payload: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
        }) => {
            return apiRequest("POST", "/api/admin/users", payload);
        },
        onSuccess: () => {
            toast({
                title: "User Created",
                description: "Staff account created",
            });
            setStaffForm({
                email: "",
                password: "",
                firstName: "",
                lastName: "",
                role: EmployeeRole.STAFF,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        },
        onError: (e: any) => {
            toast({
                title: "Error",
                description: e.message || "Failed to create user",
                variant: "destructive",
            });
        },
    });

    const [staffForm, setStaffForm] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: EmployeeRole.STAFF,
    });

    // Redirect to login on unauthorized error
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

    // Auto-generate employee ID when dialog opens
    useEffect(() => {
        if (isAddDialogOpen && !newEmployee.employeeId) {
            fetch("/api/employees/next-id")
                .then((res) => res.json())
                .then((data) => {
                    setNewEmployee((prev) => ({
                        ...prev,
                        employeeId: data.employeeId,
                    }));
                })
                .catch((error) => {
                    console.error("Failed to generate employee ID:", error);
                });
        }
    }, [isAddDialogOpen, newEmployee.employeeId]);

    if (isLoading || employeesLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading employees...</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-success/10 text-success";
            case "inactive":
                return "bg-slate-100 text-slate-700";
            case "on_leave":
                return "bg-warning/10 text-warning";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortDir("asc");
        }
    };

    const openEdit = (emp: any) => {
        setSelectedEmployee({ ...emp });
        setIsEditDialogOpen(true);
    };

    const handleEditSave = () => {
        if (!selectedEmployee) return;
        const {
            id,
            employeeId,
            firstName,
            lastName,
            department,
            status,
            employmentType,
            baseSalary,
            payGrade,
            email,
            phone,
            address,
        } = selectedEmployee;
        updateEmployeeMutation.mutate({
            id,
            updates: {
                employeeId,
                firstName,
                lastName,
                role: EmployeeRole.STAFF,
                department,
                status,
                employmentType,
                baseSalary: baseSalary?.toString?.() || "0",
                payGrade,
                email,
                phone,
                address,
            },
        });
    };

    const handleAddEmployee = () => {
        if (
            !newEmployee.employeeId ||
            !newEmployee.firstName ||
            !newEmployee.lastName ||
            !newEmployee.department
        ) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }
        const employeeData = {
            ...newEmployee,
            role: EmployeeRole.STAFF,
            startDate: new Date().toISOString().split("T")[0],
        };
        addEmployeeMutation.mutate(employeeData);
    };

    const handleCreateStaff = () => {
        if (!staffForm.email || !staffForm.password) {
            toast({
                title: "Missing",
                description: "Email & password required",
                variant: "destructive",
            });
            return;
        }
        createStaffMutation.mutate(staffForm);
    };

    const totalEmployees = safeEmployees.length;
    const activeCount = safeActiveEmployees.length;
    const onLeaveCount = safeEmployees.filter(
        (emp: any) => emp.status === "on_leave"
    ).length;

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <main className="flex-1 lg:ml-64 ml-0 min-w-0">
                <TopHeader
                    title="Employee Management"
                    subtitle="Manage employee records, payroll, and human resources"
                />

                <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center space-x-3">
                                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                            {totalEmployees}
                                        </h3>
                                        <p className="text-sm sm:text-base text-slate-600">
                                            Total Employees
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-success/20 bg-success/5">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center space-x-3">
                                    <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-success flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                            {activeCount}
                                        </h3>
                                        <p className="text-sm sm:text-base text-slate-600">
                                            Active
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-warning/20 bg-warning/5">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center space-x-3">
                                    <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-warning flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                            {onLeaveCount}
                                        </h3>
                                        <p className="text-sm sm:text-base text-slate-600">
                                            On Leave
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Employee Table */}
                    <Card>
                        <CardHeader className="pb-3 sm:pb-6">
                            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <span className="text-lg sm:text-xl">
                                    Employee Directory
                                </span>
                                <Dialog
                                    open={isAddDialogOpen}
                                    onOpenChange={setIsAddDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Employee
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xs sm:max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                                        <DialogHeader>
                                            <DialogTitle className="text-lg sm:text-xl">
                                                Add New Employee
                                            </DialogTitle>
                                            <DialogDescription className="text-sm sm:text-base">
                                                Enter the basic employee
                                                information. All fields are
                                                required.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="employeeId">
                                                    Employee ID *
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="employeeId"
                                                        value={
                                                            newEmployee.employeeId
                                                        }
                                                        onChange={(e) =>
                                                            setNewEmployee({
                                                                ...newEmployee,
                                                                employeeId:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        placeholder="EMP001"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            fetch(
                                                                "/api/employees/next-id"
                                                            )
                                                                .then((res) =>
                                                                    res.json()
                                                                )
                                                                .then(
                                                                    (data) => {
                                                                        setNewEmployee(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                employeeId:
                                                                                    data.employeeId,
                                                                            })
                                                                        );
                                                                    }
                                                                )
                                                                .catch(
                                                                    (error) => {
                                                                        console.error(
                                                                            "Failed to generate employee ID:",
                                                                            error
                                                                        );
                                                                    }
                                                                );
                                                        }}
                                                        className="whitespace-nowrap"
                                                    >
                                                        Generate
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="firstName">
                                                    First Name *
                                                </Label>
                                                <Input
                                                    id="firstName"
                                                    value={
                                                        newEmployee.firstName
                                                    }
                                                    onChange={(e) =>
                                                        setNewEmployee({
                                                            ...newEmployee,
                                                            firstName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="John"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="lastName">
                                                    Last Name *
                                                </Label>
                                                <Input
                                                    id="lastName"
                                                    value={newEmployee.lastName}
                                                    onChange={(e) =>
                                                        setNewEmployee({
                                                            ...newEmployee,
                                                            lastName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Doe"
                                                />
                                            </div>
                                            {/* Removed manual role entry; role fixed to staff */}
                                            {/* <div> role input removed </div> */}
                                            <div>
                                                <Label htmlFor="department">
                                                    Department *
                                                </Label>
                                                <Select
                                                    value={
                                                        newEmployee.department ||
                                                        undefined
                                                    }
                                                    onValueChange={(value) =>
                                                        setNewEmployee({
                                                            ...newEmployee,
                                                            department: value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="production">
                                                            Production
                                                        </SelectItem>
                                                        <SelectItem value="maintenance">
                                                            Maintenance
                                                        </SelectItem>
                                                        <SelectItem value="administration">
                                                            Administration
                                                        </SelectItem>
                                                        <SelectItem value="security">
                                                            Security
                                                        </SelectItem>
                                                        <SelectItem value="veterinary">
                                                            Veterinary
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2 mt-6">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setIsAddDialogOpen(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddEmployee}
                                                disabled={
                                                    addEmployeeMutation.isPending
                                                }
                                                className="bg-primary hover:bg-primary/90"
                                            >
                                                {addEmployeeMutation.isPending
                                                    ? "Adding..."
                                                    : "Add Employee"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {/* Controls row extended */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search employees..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="pl-10 h-10 sm:h-11"
                                        />
                                    </div>
                                </div>
                                <Select
                                    value={statusFilter || undefined}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="w-full sm:w-48 h-10 sm:h-11">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                        <SelectItem value="on_leave">
                                            On Leave
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={sortBy || undefined}
                                    onValueChange={setSortBy}
                                >
                                    <SelectTrigger className="w-full sm:w-40 h-10 sm:h-11">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="firstName">
                                            First Name
                                        </SelectItem>
                                        <SelectItem value="lastName">
                                            Last Name
                                        </SelectItem>
                                        <SelectItem value="employeeId">
                                            Employee ID
                                        </SelectItem>
                                        <SelectItem value="role">
                                            Role
                                        </SelectItem>
                                        <SelectItem value="department">
                                            Department
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setSortDir((d) =>
                                            d === "asc" ? "desc" : "asc"
                                        )
                                    }
                                >
                                    {sortDir === "asc" ? "Asc" : "Desc"}
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead
                                                onClick={() =>
                                                    toggleSort("employeeId")
                                                }
                                                className="cursor-pointer"
                                            >
                                                Employee ID
                                            </TableHead>
                                            <TableHead
                                                onClick={() =>
                                                    toggleSort("firstName")
                                                }
                                                className="cursor-pointer"
                                            >
                                                Name
                                            </TableHead>
                                            <TableHead
                                                onClick={() =>
                                                    toggleSort("role")
                                                }
                                                className="cursor-pointer"
                                            >
                                                Role
                                            </TableHead>
                                            <TableHead
                                                className="hidden sm:table-cell cursor-pointer"
                                                onClick={() =>
                                                    toggleSort("department")
                                                }
                                            >
                                                Department
                                            </TableHead>
                                            <TableHead
                                                onClick={() =>
                                                    toggleSort("status")
                                                }
                                                className="cursor-pointer"
                                            >
                                                Status
                                            </TableHead>
                                            <TableHead className="min-w-[80px]">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEmployees.length === 0 ? (
                                            // ...existing empty state row...
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-center py-8"
                                                >
                                                    No employees
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredEmployees.map(
                                                (employee: any) => (
                                                    <TableRow
                                                        key={employee.id}
                                                        className="hover:bg-slate-50"
                                                    >
                                                        <TableCell className="font-mono text-sm">
                                                            {
                                                                employee.employeeId
                                                            }
                                                        </TableCell>
                                                        <TableCell className="font-medium text-sm">
                                                            {employee.firstName}{" "}
                                                            {employee.lastName}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {employee.role}
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell text-sm">
                                                            <Badge
                                                                variant="outline"
                                                                className="capitalize text-xs"
                                                            >
                                                                {
                                                                    employee.department
                                                                }
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`${getStatusColor(
                                                                    employee.status
                                                                )} text-xs`}
                                                            >
                                                                {employee.status?.replace(
                                                                    "_",
                                                                    " "
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        employee
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
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

                    {isAdmin && (
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">
                                    Create Staff Account
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        value={staffForm.email}
                                        onChange={(e) =>
                                            setStaffForm((p) => ({
                                                ...p,
                                                email: e.target.value,
                                            }))
                                        }
                                        placeholder="staff@example.com"
                                    />
                                </div>
                                <div>
                                    <Label>Password *</Label>
                                    <Input
                                        type="password"
                                        value={staffForm.password}
                                        onChange={(e) =>
                                            setStaffForm((p) => ({
                                                ...p,
                                                password: e.target.value,
                                            }))
                                        }
                                        placeholder="Min 8 chars"
                                    />
                                </div>
                                <div>
                                    <Label>First Name</Label>
                                    <Input
                                        value={staffForm.firstName}
                                        onChange={(e) =>
                                            setStaffForm((p) => ({
                                                ...p,
                                                firstName: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Last Name</Label>
                                    <Input
                                        value={staffForm.lastName}
                                        onChange={(e) =>
                                            setStaffForm((p) => ({
                                                ...p,
                                                lastName: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Role</Label>
                                    <Select
                                        value={staffForm.role || undefined}
                                        onValueChange={(v) =>
                                            setStaffForm((p) => ({
                                                ...p,
                                                role: v as EmployeeRole,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem
                                                value={EmployeeRole.STAFF}
                                            >
                                                Staff
                                            </SelectItem>
                                            <SelectItem
                                                value={EmployeeRole.ADMIN}
                                            >
                                                Admin
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleCreateStaff}
                                        disabled={createStaffMutation.isPending}
                                        className="w-full"
                                    >
                                        {createStaffMutation.isPending
                                            ? "Creating..."
                                            : "Create"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
            {/* Edit Dialog */}
            <Dialog
                open={isEditDialogOpen}
                onOpenChange={(o) => {
                    if (!o) {
                        setIsEditDialogOpen(false);
                        setSelectedEmployee(null);
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update employee details & status
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEmployee && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Employee ID</Label>
                                    <Input
                                        value={selectedEmployee.employeeId}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                employeeId: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={
                                            selectedEmployee.status || undefined
                                        }
                                        onValueChange={(v) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                status: v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                            <SelectItem value="on_leave">
                                                On Leave
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>First Name</Label>
                                    <Input
                                        value={selectedEmployee.firstName}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                firstName: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Last Name</Label>
                                    <Input
                                        value={selectedEmployee.lastName}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                lastName: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Role</Label>
                                    <Input
                                        value={selectedEmployee.role}
                                        disabled
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <Label>Department</Label>
                                    <Select
                                        value={
                                            selectedEmployee.department ||
                                            undefined
                                        }
                                        onValueChange={(v) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                department: v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="production">
                                                Production
                                            </SelectItem>
                                            <SelectItem value="maintenance">
                                                Maintenance
                                            </SelectItem>
                                            <SelectItem value="administration">
                                                Administration
                                            </SelectItem>
                                            <SelectItem value="security">
                                                Security
                                            </SelectItem>
                                            <SelectItem value="veterinary">
                                                Veterinary
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Employment Type</Label>
                                    <Select
                                        value={
                                            selectedEmployee.employmentType ||
                                            undefined
                                        }
                                        onValueChange={(v) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                employmentType: v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full_time">
                                                Full Time
                                            </SelectItem>
                                            <SelectItem value="part_time">
                                                Part Time
                                            </SelectItem>
                                            <SelectItem value="contract">
                                                Contract
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Pay Grade</Label>
                                    <Input
                                        value={selectedEmployee.payGrade || ""}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                payGrade: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Base Salary</Label>
                                    <Input
                                        type="number"
                                        value={selectedEmployee.baseSalary}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                baseSalary: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        value={selectedEmployee.email || ""}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                email: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={selectedEmployee.phone || ""}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                phone: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Address</Label>
                                    <Textarea
                                        value={selectedEmployee.address || ""}
                                        onChange={(e) =>
                                            setSelectedEmployee((p: any) => ({
                                                ...p,
                                                address: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setSelectedEmployee(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleEditSave}
                                    disabled={updateEmployeeMutation.isPending}
                                >
                                    {updateEmployeeMutation.isPending
                                        ? "Saving..."
                                        : "Save"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
