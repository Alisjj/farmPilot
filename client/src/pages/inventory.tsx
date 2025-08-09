import { useEffect, useState } from "react";
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
import {
    Search,
    Filter,
    Plus,
    Package,
    AlertTriangle,
    Calendar,
    History,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Inventory() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        category: "",
        currentStock: "",
        unit: "",
        reorderPoint: "",
        unitCost: "",
        storageLocation: "",
        expirationDate: "",
    });
    const [adjustItem, setAdjustItem] = useState<any | null>(null);
    const [adjustData, setAdjustData] = useState({
        adjustmentType: "restock",
        quantity: "",
        reason: "",
    });
    const [showThresholdDialog, setShowThresholdDialog] = useState(false);
    const [newThreshold, setNewThreshold] = useState({
        thresholdType: "inventory_low_stock_percent",
        thresholdValue: "50",
        comparisonType: "less_than_or_equal",
        alertLevel: "warning",
    });
    const [editingThreshold, setEditingThreshold] = useState<any | null>(null);

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
        data: inventoryItems,
        isLoading: itemsLoading,
        error,
    } = useQuery({
        queryKey: ["/api/inventory"],
        enabled: isAuthenticated,
    });

    const { data: lowStockItems } = useQuery({
        queryKey: ["/api/inventory/low-stock"],
        enabled: isAuthenticated,
    });

    const { data: expiringItems } = useQuery({
        queryKey: ["/api/inventory/expiring/30"],
        enabled: isAuthenticated,
    });

    const { data: thresholdsData } = useQuery({
        queryKey: ["/api/thresholds"],
        enabled: isAuthenticated,
    });

    const addItemMutation = useMutation({
        mutationFn: async (itemData: any) => {
            await apiRequest("POST", "/api/inventory", itemData);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Inventory item added successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
            setIsAddDialogOpen(false);
            setNewItem({
                name: "",
                category: "",
                currentStock: "",
                unit: "",
                reorderPoint: "",
                unitCost: "",
                storageLocation: "",
                expirationDate: "",
            });
        },
        onError: (error) => {
            if (isUnauthorizedError(error as Error)) {
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
            toast({
                title: "Error",
                description: "Failed to add inventory item",
                variant: "destructive",
            });
        },
    });

    const adjustMutation = useMutation({
        mutationFn: async (vars: any) => {
            await apiRequest(
                "POST",
                `/api/inventory/${vars.id}/adjust`,
                vars.payload
            );
        },
        onMutate: async (vars) => {
            await queryClient.cancelQueries({ queryKey: ["/api/inventory"] });
            const prev = queryClient.getQueryData(["/api/inventory"]);
            if (prev && Array.isArray(prev)) {
                const copy = [...prev];
                const idx = copy.findIndex((i: any) => i.id === vars.id);
                if (idx !== -1) {
                    const q = parseFloat(vars.payload.quantity);
                    copy[idx] = {
                        ...copy[idx],
                        currentStock: (
                            parseFloat(copy[idx].currentStock) +
                            (vars.payload.adjustmentType === "restock" ? q : -q)
                        ).toString(),
                    };
                    queryClient.setQueryData(["/api/inventory"], copy);
                }
            }
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev)
                queryClient.setQueryData(["/api/inventory"], ctx.prev);
            toast({
                title: "Error",
                description: "Adjustment failed",
                variant: "destructive",
            });
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Stock adjusted" });
            queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
            setAdjustItem(null);
            setAdjustData({
                adjustmentType: "restock",
                quantity: "",
                reason: "",
            });
        },
    });

    const createThresholdMutation = useMutation({
        mutationFn: async (payload: any) => {
            await apiRequest("POST", "/api/thresholds", {
                ...payload,
                notificationChannels: ["dashboard"],
                isActive: true,
            });
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Threshold created" });
            queryClient.invalidateQueries({ queryKey: ["/api/thresholds"] });
            setNewThreshold({
                thresholdType: "inventory_low_stock_percent",
                thresholdValue: "50",
                comparisonType: "less_than_or_equal",
                alertLevel: "warning",
            });
        },
        onError: () =>
            toast({
                title: "Error",
                description: "Failed to create threshold",
                variant: "destructive",
            }),
    });

    const updateThresholdMutation = useMutation({
        mutationFn: async ({ id, updates }: any) => {
            await apiRequest("PUT", `/api/thresholds/${id}`, updates);
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Threshold updated" });
            queryClient.invalidateQueries({ queryKey: ["/api/thresholds"] });
            setEditingThreshold(null);
        },
        onError: () =>
            toast({
                title: "Error",
                description: "Failed to update threshold",
                variant: "destructive",
            }),
    });

    const adjustmentsQuery = useQuery({
        queryKey: [
            adjustItem ? `/api/inventory/${adjustItem.id}/adjustments` : null,
        ],
        enabled: !!adjustItem && isAuthenticated,
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

    if (isLoading || itemsLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading inventory...</p>
                </div>
            </div>
        );
    }

    const getStockStatus = (currentStock: string, reorderPoint: string) => {
        const current = parseFloat(currentStock);
        const reorder = parseFloat(reorderPoint);

        if (current <= reorder * 0.5)
            return { status: "Critical", color: "destructive" };
        if (current <= reorder)
            return { status: "Low Stock", color: "warning" };
        return { status: "In Stock", color: "success" };
    };

    const isExpiringSoon = (expirationDate?: string) => {
        if (!expirationDate) return false;
        const expiry = new Date(expirationDate);
        const now = new Date();
        const diffDays = Math.ceil(
            (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)
        );
        return diffDays <= 30 && diffDays > 0;
    };

    const filteredItems = Array.isArray(inventoryItems)
        ? inventoryItems.filter((item: any) => {
              const matchesSearch =
                  searchTerm === "" ||
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());

              const matchesCategory =
                  categoryFilter === "all" || item.category === categoryFilter;

              return matchesSearch && matchesCategory;
          })
        : [];

    const filteredThresholds = Array.isArray(thresholdsData)
        ? thresholdsData.filter((t: any) =>
              t.thresholdType.startsWith("inventory_low_stock")
          )
        : [];

    const handleAddItem = () => {
        if (
            !newItem.name ||
            !newItem.category ||
            !newItem.currentStock ||
            !newItem.unit ||
            !newItem.reorderPoint
        ) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        addItemMutation.mutate({
            ...newItem,
            currentStock: parseFloat(newItem.currentStock),
            reorderPoint: parseFloat(newItem.reorderPoint),
            unitCost: newItem.unitCost ? parseFloat(newItem.unitCost) : null,
            expirationDate: newItem.expirationDate || null,
        });
    };

    const handleAdjust = () => {
        if (!adjustItem || !adjustData.quantity) return;
        adjustMutation.mutate({
            id: adjustItem.id,
            payload: {
                adjustmentType: adjustData.adjustmentType,
                quantity: parseFloat(adjustData.quantity),
                reason: adjustData.reason || undefined,
            },
        });
    };

    const handleCreateThreshold = () => {
        createThresholdMutation.mutate(newThreshold);
    };

    const handleUpdateThreshold = (t: any) => {
        updateThresholdMutation.mutate({
            id: t.id,
            updates: {
                thresholdValue: editingThreshold.thresholdValue,
                alertLevel: editingThreshold.alertLevel,
            },
        });
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <main className="flex-1 lg:ml-64 ml-0">
                <TopHeader
                    title="Inventory Management"
                    subtitle="Monitor stock levels, track expiration dates, and manage supply chain"
                />

                <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
                    {/* Alert Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
                        <Card className="border-accent/20 bg-accent/5">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <AlertTriangle className="h-8 w-8 text-accent" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            {Array.isArray(lowStockItems)
                                                ? lowStockItems.length
                                                : 0}
                                        </h3>
                                        <p className="text-slate-600">
                                            Low Stock Items
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-warning/20 bg-warning/5">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-8 w-8 text-warning" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            {Array.isArray(expiringItems)
                                                ? expiringItems.length
                                                : 0}
                                        </h3>
                                        <p className="text-slate-600">
                                            Expiring Soon
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Package className="h-8 w-8 text-primary" />
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900">
                                                {Array.isArray(inventoryItems)
                                                    ? inventoryItems.length
                                                    : 0}
                                            </h3>
                                            <p className="text-slate-600">
                                                Total Items
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        data-cy="manage-thresholds"
                                        onClick={() =>
                                            setShowThresholdDialog(true)
                                        }
                                    >
                                        Thresholds
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Inventory Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Inventory Items</span>
                                <Dialog
                                    open={isAddDialogOpen}
                                    onOpenChange={setIsAddDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary hover:bg-primary/90">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Item
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Add New Inventory Item
                                            </DialogTitle>
                                            <DialogDescription>
                                                Enter the details for the new
                                                inventory item.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="name">
                                                    Item Name *
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={newItem.name}
                                                    onChange={(e) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Enter item name"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="category">
                                                    Category *
                                                </Label>
                                                <Select
                                                    value={newItem.category}
                                                    onValueChange={(value) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            category: value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="feed">
                                                            Feed
                                                        </SelectItem>
                                                        <SelectItem value="medicine">
                                                            Medicine
                                                        </SelectItem>
                                                        <SelectItem value="equipment">
                                                            Equipment
                                                        </SelectItem>
                                                        <SelectItem value="supplies">
                                                            Supplies
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="currentStock">
                                                    Current Stock *
                                                </Label>
                                                <Input
                                                    id="currentStock"
                                                    type="number"
                                                    value={newItem.currentStock}
                                                    onChange={(e) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            currentStock:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="unit">
                                                    Unit *
                                                </Label>
                                                <Input
                                                    id="unit"
                                                    value={newItem.unit}
                                                    onChange={(e) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            unit: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="kg, tons, bottles, units"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="reorderPoint">
                                                    Reorder Point *
                                                </Label>
                                                <Input
                                                    id="reorderPoint"
                                                    type="number"
                                                    value={newItem.reorderPoint}
                                                    onChange={(e) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            reorderPoint:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="unitCost">
                                                    Unit Cost
                                                </Label>
                                                <Input
                                                    id="unitCost"
                                                    type="number"
                                                    step="0.01"
                                                    value={newItem.unitCost}
                                                    onChange={(e) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            unitCost:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="storageLocation">
                                                    Storage Location
                                                </Label>
                                                <Input
                                                    id="storageLocation"
                                                    value={
                                                        newItem.storageLocation
                                                    }
                                                    onChange={(e) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            storageLocation:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Warehouse A, Section 1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="expirationDate">
                                                    Expiration Date
                                                </Label>
                                                <Input
                                                    id="expirationDate"
                                                    type="date"
                                                    value={
                                                        newItem.expirationDate
                                                    }
                                                    onChange={(e) =>
                                                        setNewItem({
                                                            ...newItem,
                                                            expirationDate:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
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
                                                onClick={handleAddItem}
                                                disabled={
                                                    addItemMutation.isPending
                                                }
                                                className="bg-primary hover:bg-primary/90"
                                            >
                                                {addItemMutation.isPending
                                                    ? "Adding..."
                                                    : "Add Item"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search inventory..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select
                                    value={categoryFilter}
                                    onValueChange={setCategoryFilter}
                                >
                                    <SelectTrigger className="w-48">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Categories
                                        </SelectItem>
                                        <SelectItem value="feed">
                                            Feed
                                        </SelectItem>
                                        <SelectItem value="medicine">
                                            Medicine
                                        </SelectItem>
                                        <SelectItem value="equipment">
                                            Equipment
                                        </SelectItem>
                                        <SelectItem value="supplies">
                                            Supplies
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Current Stock</TableHead>
                                            <TableHead>Reorder Point</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Unit Cost</TableHead>
                                            <TableHead>Expiration</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    className="text-center py-8"
                                                >
                                                    <div className="text-slate-500">
                                                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                        <p>
                                                            No inventory items
                                                            found
                                                        </p>
                                                        <p className="text-sm">
                                                            Try adjusting your
                                                            filters or add a new
                                                            item
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredItems.map((item: any) => {
                                                const stockInfo =
                                                    getStockStatus(
                                                        item.currentStock,
                                                        item.reorderPoint
                                                    );
                                                const expiring = isExpiringSoon(
                                                    item.expirationDate
                                                );

                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">
                                                            {item.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className="capitalize"
                                                            >
                                                                {item.category}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono">
                                                            {parseFloat(
                                                                item.currentStock
                                                            ).toLocaleString()}{" "}
                                                            {item.unit}
                                                        </TableCell>
                                                        <TableCell className="font-mono">
                                                            {parseFloat(
                                                                item.reorderPoint
                                                            ).toLocaleString()}{" "}
                                                            {item.unit}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    stockInfo.color ===
                                                                    "success"
                                                                        ? "default"
                                                                        : "secondary"
                                                                }
                                                                className={
                                                                    expiring
                                                                        ? "bg-warning/10 text-warning"
                                                                        : stockInfo.color ===
                                                                          "success"
                                                                        ? "bg-success/10 text-success"
                                                                        : stockInfo.color ===
                                                                          "warning"
                                                                        ? "bg-warning/10 text-warning"
                                                                        : "bg-accent/10 text-accent"
                                                                }
                                                            >
                                                                {expiring
                                                                    ? "Expiring Soon"
                                                                    : stockInfo.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono">
                                                            {item.unitCost
                                                                ? `$${parseFloat(
                                                                      item.unitCost
                                                                  ).toFixed(2)}`
                                                                : "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.expirationDate
                                                                ? new Date(
                                                                      item.expirationDate
                                                                  ).toLocaleDateString()
                                                                : "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.storageLocation ||
                                                                "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                data-cy={`adjust-${item.id}`}
                                                                onClick={() =>
                                                                    setAdjustItem(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                Adjust
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {adjustItem && (
                    <Dialog
                        open={!!adjustItem}
                        onOpenChange={(o) => {
                            if (!o) setAdjustItem(null);
                        }}
                    >
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>
                                    Adjust Stock - {adjustItem.name}
                                </DialogTitle>
                                <DialogDescription>
                                    Record a restock or consumption adjustment.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Type</Label>
                                        <Select
                                            value={adjustData.adjustmentType}
                                            onValueChange={(v) =>
                                                setAdjustData({
                                                    ...adjustData,
                                                    adjustmentType: v,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="restock">
                                                    Restock
                                                </SelectItem>
                                                <SelectItem value="consume">
                                                    Consume
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            value={adjustData.quantity}
                                            onChange={(e) =>
                                                setAdjustData({
                                                    ...adjustData,
                                                    quantity: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Reason (optional)</Label>
                                        <Input
                                            value={adjustData.reason}
                                            onChange={(e) =>
                                                setAdjustData({
                                                    ...adjustData,
                                                    reason: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setAdjustItem(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAdjust}
                                        disabled={adjustMutation.isPending}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {adjustMutation.isPending
                                            ? "Saving..."
                                            : "Save Adjustment"}
                                    </Button>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">
                                        Recent Adjustments
                                    </h4>
                                    {adjustmentsQuery.isLoading ? (
                                        <p className="text-xs text-slate-500">
                                            Loading...
                                        </p>
                                    ) : (
                                        Array.isArray(adjustmentsQuery.data) &&
                                        adjustmentsQuery.data.length > 0 && (
                                            <div className="max-h-40 overflow-y-auto border rounded-md divide-y text-xs">
                                                {adjustmentsQuery.data
                                                    .slice(0, 10)
                                                    .map((adj: any) => (
                                                        <div
                                                            key={adj.id}
                                                            className="p-2 flex justify-between"
                                                        >
                                                            <span className="font-mono">
                                                                {adj.adjustmentType ===
                                                                "restock"
                                                                    ? "+"
                                                                    : "-"}
                                                                {parseFloat(
                                                                    adj.quantity
                                                                ).toLocaleString()}
                                                            </span>
                                                            <span>
                                                                {new Date(
                                                                    adj.createdAt
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {showThresholdDialog && (
                    <Dialog
                        open={showThresholdDialog}
                        onOpenChange={(o) => {
                            if (!o) setShowThresholdDialog(false);
                        }}
                    >
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Low Stock Thresholds</DialogTitle>
                                <DialogDescription>
                                    Configure alert thresholds for low inventory
                                    levels.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                                <div className="space-y-3 border p-4 rounded-md">
                                    <h4 className="text-sm font-semibold">
                                        Add Threshold
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <Label>Type</Label>
                                            <Select
                                                value={
                                                    newThreshold.thresholdType
                                                }
                                                onValueChange={(v) =>
                                                    setNewThreshold({
                                                        ...newThreshold,
                                                        thresholdType: v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="inventory_low_stock_percent">
                                                        Percent Remaining (%)
                                                    </SelectItem>
                                                    <SelectItem value="inventory_low_stock_absolute">
                                                        Absolute Stock
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Value</Label>
                                            <Input
                                                value={
                                                    newThreshold.thresholdValue
                                                }
                                                onChange={(e) =>
                                                    setNewThreshold({
                                                        ...newThreshold,
                                                        thresholdValue:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Alert Level</Label>
                                            <Select
                                                value={newThreshold.alertLevel}
                                                onValueChange={(v) =>
                                                    setNewThreshold({
                                                        ...newThreshold,
                                                        alertLevel: v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">
                                                        Low
                                                    </SelectItem>
                                                    <SelectItem value="medium">
                                                        Medium
                                                    </SelectItem>
                                                    <SelectItem value="high">
                                                        High
                                                    </SelectItem>
                                                    <SelectItem value="critical">
                                                        Critical
                                                    </SelectItem>
                                                    <SelectItem value="warning">
                                                        Warning
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                className="w-full"
                                                disabled={
                                                    createThresholdMutation.isPending
                                                }
                                                onClick={handleCreateThreshold}
                                                data-cy="add-threshold-btn"
                                            >
                                                {createThresholdMutation.isPending
                                                    ? "Adding..."
                                                    : "Add"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">
                                        Existing Thresholds
                                    </h4>
                                    {filteredThresholds.length === 0 ? (
                                        <p className="text-xs text-slate-500">
                                            No low stock thresholds configured.
                                        </p>
                                    ) : (
                                        <div className="border rounded-md divide-y">
                                            {filteredThresholds.map(
                                                (t: any) => {
                                                    const isEditing =
                                                        editingThreshold?.id ===
                                                        t.id;
                                                    return (
                                                        <div
                                                            key={t.id}
                                                            className="p-3 flex flex-col md:flex-row md:items-center gap-3 text-sm"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="font-mono text-xs mb-1">
                                                                    {
                                                                        t.thresholdType
                                                                    }
                                                                </div>
                                                                {isEditing ? (
                                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                                        <Input
                                                                            className="sm:w-32"
                                                                            value={
                                                                                editingThreshold.thresholdValue
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setEditingThreshold(
                                                                                    {
                                                                                        ...editingThreshold,
                                                                                        thresholdValue:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    }
                                                                                )
                                                                            }
                                                                        />
                                                                        <Select
                                                                            value={
                                                                                editingThreshold.alertLevel
                                                                            }
                                                                            onValueChange={(
                                                                                v
                                                                            ) =>
                                                                                setEditingThreshold(
                                                                                    {
                                                                                        ...editingThreshold,
                                                                                        alertLevel:
                                                                                            v,
                                                                                    }
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger className="sm:w-32">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="low">
                                                                                    Low
                                                                                </SelectItem>
                                                                                <SelectItem value="medium">
                                                                                    Medium
                                                                                </SelectItem>
                                                                                <SelectItem value="high">
                                                                                    High
                                                                                </SelectItem>
                                                                                <SelectItem value="critical">
                                                                                    Critical
                                                                                </SelectItem>
                                                                                <SelectItem value="warning">
                                                                                    Warning
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-slate-600">
                                                                        Value:{" "}
                                                                        {
                                                                            t.thresholdValue
                                                                        }{" "}
                                                                        | Level:{" "}
                                                                        {
                                                                            t.alertLevel
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() =>
                                                                                setEditingThreshold(
                                                                                    null
                                                                                )
                                                                            }
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleUpdateThreshold(
                                                                                    t
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                updateThresholdMutation.isPending
                                                                            }
                                                                            data-cy={`save-threshold-${t.id}`}
                                                                        >
                                                                            {updateThresholdMutation.isPending
                                                                                ? "Saving..."
                                                                                : "Save"}
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            setEditingThreshold(
                                                                                t
                                                                            )
                                                                        }
                                                                        data-cy={`edit-threshold-${t.id}`}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setShowThresholdDialog(false)
                                    }
                                >
                                    Close
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </main>
        </div>
    );
}
