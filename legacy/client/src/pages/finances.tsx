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
import { Textarea } from "@/components/ui/textarea";
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
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
} from "lucide-react";

export default function Finances() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        type: "",
        category: "",
        amount: "",
        description: "",
        transactionDate: new Date().toISOString().split("T")[0],
        paymentMethod: "",
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
        data: transactions,
        isLoading: transactionsLoading,
        error,
    } = useQuery({
        queryKey: ["/api/finances"],
        enabled: isAuthenticated,
    });

    const addTransactionMutation = useMutation({
        mutationFn: async (transactionData: any) => {
            await apiRequest("POST", "/api/finances", transactionData);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Transaction recorded successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
            setIsAddDialogOpen(false);
            setNewTransaction({
                type: "",
                category: "",
                amount: "",
                description: "",
                transactionDate: new Date().toISOString().split("T")[0],
                paymentMethod: "",
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
                description: "Failed to record transaction",
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

    if (isLoading || transactionsLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading financial data...</p>
                </div>
            </div>
        );
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "revenue":
                return "bg-success/10 text-success";
            case "expense":
                return "bg-accent/10 text-accent";
            case "salary":
                return "bg-secondary/10 text-secondary";
            case "procurement":
                return "bg-warning/10 text-warning";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    const filteredTransactions = (
        Array.isArray(transactions) ? transactions : []
    ).filter((transaction: any) => {
        const matchesSearch =
            searchTerm === "" ||
            transaction.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            transaction.category
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesType =
            typeFilter === "all" || transaction.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const handleAddTransaction = () => {
        if (
            !newTransaction.type ||
            !newTransaction.category ||
            !newTransaction.amount ||
            !newTransaction.transactionDate
        ) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        addTransactionMutation.mutate({
            ...newTransaction,
            amount: parseFloat(newTransaction.amount),
        });
    };

    // Calculate summary metrics
    const totalRevenue = (Array.isArray(transactions) ? transactions : [])
        .filter((t: any) => t.type === "revenue")
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalExpenses = (Array.isArray(transactions) ? transactions : [])
        .filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalSalaries = (Array.isArray(transactions) ? transactions : [])
        .filter((t: any) => t.type === "salary")
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const netProfit = totalRevenue - totalExpenses - totalSalaries;

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <main className="flex-1 lg:ml-64 ml-0">
                <TopHeader
                    title="Financial Management"
                    subtitle="Track expenses, revenue, payroll, and financial performance"
                />

                <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6 w-full max-w-full overflow-x-hidden">
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
                        <Card className="border-success/20 bg-success/5">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <TrendingUp className="h-8 w-8 text-success" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            ₦{totalRevenue.toLocaleString()}
                                        </h3>
                                        <p className="text-slate-600">
                                            Total Revenue
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-accent/20 bg-accent/5">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <TrendingDown className="h-8 w-8 text-accent" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            ₦{totalExpenses.toLocaleString()}
                                        </h3>
                                        <p className="text-slate-600">
                                            Total Expenses
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-secondary/20 bg-secondary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <CreditCard className="h-8 w-8 text-secondary" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            ₦{totalSalaries.toLocaleString()}
                                        </h3>
                                        <p className="text-slate-600">
                                            Payroll
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className={`border-primary/20 ${
                                netProfit >= 0 ? "bg-success/5" : "bg-accent/5"
                            }`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <DollarSign
                                        className={`h-8 w-8 ${
                                            netProfit >= 0
                                                ? "text-success"
                                                : "text-accent"
                                        }`}
                                    />
                                    <div>
                                        <h3
                                            className={`text-2xl font-bold ${
                                                netProfit >= 0
                                                    ? "text-success"
                                                    : "text-accent"
                                            }`}
                                        >
                                            ₦
                                            {Math.abs(
                                                netProfit
                                            ).toLocaleString()}
                                        </h3>
                                        <p className="text-slate-600">
                                            Net{" "}
                                            {netProfit >= 0 ? "Profit" : "Loss"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Financial Transactions</span>
                                <Dialog
                                    open={isAddDialogOpen}
                                    onOpenChange={setIsAddDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary hover:bg-primary/90">
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Transaction
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Add New Transaction
                                            </DialogTitle>
                                            <DialogDescription>
                                                Record a new financial
                                                transaction.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="type">
                                                    Transaction Type *
                                                </Label>
                                                <Select
                                                    value={newTransaction.type}
                                                    onValueChange={(value) =>
                                                        setNewTransaction({
                                                            ...newTransaction,
                                                            type: value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="revenue">
                                                            Revenue
                                                        </SelectItem>
                                                        <SelectItem value="expense">
                                                            Expense
                                                        </SelectItem>
                                                        <SelectItem value="salary">
                                                            Salary
                                                        </SelectItem>
                                                        <SelectItem value="procurement">
                                                            Procurement
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="category">
                                                    Category *
                                                </Label>
                                                <Input
                                                    id="category"
                                                    value={
                                                        newTransaction.category
                                                    }
                                                    onChange={(e) =>
                                                        setNewTransaction({
                                                            ...newTransaction,
                                                            category:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Feed, Equipment, Sales, etc."
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="amount">
                                                    Amount *
                                                </Label>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={
                                                        newTransaction.amount
                                                    }
                                                    onChange={(e) =>
                                                        setNewTransaction({
                                                            ...newTransaction,
                                                            amount: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="transactionDate">
                                                    Date *
                                                </Label>
                                                <Input
                                                    id="transactionDate"
                                                    type="date"
                                                    value={
                                                        newTransaction.transactionDate
                                                    }
                                                    onChange={(e) =>
                                                        setNewTransaction({
                                                            ...newTransaction,
                                                            transactionDate:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="paymentMethod">
                                                    Payment Method
                                                </Label>
                                                <Select
                                                    value={
                                                        newTransaction.paymentMethod
                                                    }
                                                    onValueChange={(value) =>
                                                        setNewTransaction({
                                                            ...newTransaction,
                                                            paymentMethod:
                                                                value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cash">
                                                            Cash
                                                        </SelectItem>
                                                        <SelectItem value="bank_transfer">
                                                            Bank Transfer
                                                        </SelectItem>
                                                        <SelectItem value="check">
                                                            Check
                                                        </SelectItem>
                                                        <SelectItem value="credit_card">
                                                            Credit Card
                                                        </SelectItem>
                                                        <SelectItem value="mobile_payment">
                                                            Mobile Payment
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor="description">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    value={
                                                        newTransaction.description
                                                    }
                                                    onChange={(e) =>
                                                        setNewTransaction({
                                                            ...newTransaction,
                                                            description:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Transaction details..."
                                                    rows={3}
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
                                                onClick={handleAddTransaction}
                                                disabled={
                                                    addTransactionMutation.isPending
                                                }
                                                className="bg-primary hover:bg-primary/90"
                                            >
                                                {addTransactionMutation.isPending
                                                    ? "Recording..."
                                                    : "Add Transaction"}
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
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select
                                    value={typeFilter}
                                    onValueChange={setTypeFilter}
                                >
                                    <SelectTrigger className="w-48">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Types
                                        </SelectItem>
                                        <SelectItem value="revenue">
                                            Revenue
                                        </SelectItem>
                                        <SelectItem value="expense">
                                            Expense
                                        </SelectItem>
                                        <SelectItem value="salary">
                                            Salary
                                        </SelectItem>
                                        <SelectItem value="procurement">
                                            Procurement
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>
                                                Payment Method
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Amount
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    className="text-center py-8"
                                                >
                                                    <div className="text-slate-500">
                                                        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                        <p>
                                                            No transactions
                                                            found
                                                        </p>
                                                        <p className="text-sm">
                                                            Try adjusting your
                                                            filters or add a new
                                                            transaction
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredTransactions.map(
                                                (transaction: any) => (
                                                    <TableRow
                                                        key={transaction.id}
                                                    >
                                                        <TableCell>
                                                            {new Date(
                                                                transaction.transactionDate
                                                            ).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={getTypeColor(
                                                                    transaction.type
                                                                )}
                                                            >
                                                                {transaction.type.toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                            {
                                                                transaction.category
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.description ||
                                                                "-"}
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                            {transaction.paymentMethod?.replace(
                                                                "_",
                                                                " "
                                                            ) || "-"}
                                                        </TableCell>
                                                        <TableCell
                                                            className={`text-right font-mono font-medium ${
                                                                transaction.type ===
                                                                "revenue"
                                                                    ? "text-success"
                                                                    : "text-slate-900"
                                                            }`}
                                                        >
                                                            {transaction.type ===
                                                            "revenue"
                                                                ? "+"
                                                                : "-"}
                                                            ₦
                                                            {parseFloat(
                                                                transaction.amount
                                                            ).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className="capitalize"
                                                            >
                                                                {transaction.status ||
                                                                    "Completed"}
                                                            </Badge>
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
