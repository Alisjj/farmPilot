import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EggSalesData } from "@shared/types/activities";
import { DollarSign } from "lucide-react";

const schema = z.object({
    quantity: z.number().min(1, "Quantity required"),
    pricePerDozen: z.number().min(0, "Price required"),
    buyer: z.string().min(1, "Buyer required"),
    qualityGrade: z.enum(["A", "B", "C"]),
    deliveryMethod: z.enum(["pickup", "delivery"]),
    paymentStatus: z.enum(["pending", "paid", "overdue"]).default("pending"),
    deliveryDate: z.string().optional(),
    customerContact: z.string().optional(),
    packagingType: z.enum(["cartons", "trays", "bulk"]).optional(),
    notes: z.string().optional(),
});

export type EggSalesFormData = z.infer<typeof schema>;

interface Props {
    onSubmit: (data: EggSalesData) => void;
    onCancel: () => void;
    initialData?: Partial<EggSalesData>;
    isLoading?: boolean;
}

export default function EggSalesForm({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: Props) {
    const form = useForm<EggSalesFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            quantity: initialData?.quantity || 0,
            pricePerDozen: initialData?.pricePerDozen || 0,
            buyer: initialData?.buyer || "",
            qualityGrade: initialData?.qualityGrade || "A",
            deliveryMethod: initialData?.deliveryMethod || "pickup",
            paymentStatus: initialData?.paymentStatus || "pending",
            deliveryDate: initialData?.deliveryDate,
            customerContact: initialData?.customerContact,
            packagingType: initialData?.packagingType,
            notes: "",
        },
    });

    const watched = form.watch();
    const dozens = watched.quantity ? watched.quantity / 12 : 0;
    const totalRevenue = dozens
        ? +(dozens * watched.pricePerDozen).toFixed(2)
        : 0;

    const handleSubmit = (data: EggSalesFormData) => {
        const submission: EggSalesData = {
            quantity: data.quantity,
            pricePerDozen: data.pricePerDozen,
            totalRevenue,
            buyer: data.buyer,
            qualityGrade: data.qualityGrade,
            deliveryMethod: data.deliveryMethod,
            paymentStatus: data.paymentStatus,
            deliveryDate: data.deliveryDate,
            customerContact: data.customerContact,
            packagingType: data.packagingType,
        };
        onSubmit(submission);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Egg Sales
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity (eggs) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        parseInt(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pricePerDozen"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price / Dozen *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="buyer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Buyer *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Customer name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="qualityGrade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Grade *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="A">
                                                    A
                                                </SelectItem>
                                                <SelectItem value="B">
                                                    B
                                                </SelectItem>
                                                <SelectItem value="C">
                                                    C
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deliveryMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Delivery *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pickup">
                                                    Pickup
                                                </SelectItem>
                                                <SelectItem value="delivery">
                                                    Delivery
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="paymentStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Status *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">
                                                    Pending
                                                </SelectItem>
                                                <SelectItem value="paid">
                                                    Paid
                                                </SelectItem>
                                                <SelectItem value="overdue">
                                                    Overdue
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deliveryDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Delivery Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="packagingType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Packaging</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="cartons">
                                                    Cartons
                                                </SelectItem>
                                                <SelectItem value="trays">
                                                    Trays
                                                </SelectItem>
                                                <SelectItem value="bulk">
                                                    Bulk
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="customerContact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer Contact</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Phone or email"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="Additional details"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="text-sm text-muted-foreground">
                            Dozens: {dozens.toFixed(2)} | Estimated Revenue:{" "}
                            {totalRevenue.toFixed(2)}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Sale"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
