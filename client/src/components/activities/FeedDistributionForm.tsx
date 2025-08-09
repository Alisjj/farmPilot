import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { FARM_SECTIONS, FeedDistributionData } from "@shared/types/activities";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Gauge, Droplets } from "lucide-react";

const feedDistributionSchema = z.object({
    feedType: z.string().min(1, "Feed type required"),
    quantityKg: z.number().min(0.1, "Minimum 0.1 kg").max(1000, "Too large"),
    feedingTime: z.string().min(1, "Feeding time required"),
    distributionMethod: z.enum(["automatic", "manual"], {
        required_error: "Method required",
    }),
    feedQuality: z.enum(["excellent", "good", "poor"], {
        required_error: "Quality required",
    }),
    targetSection: z.string().min(1, "Section required"),
    birdCount: z.number().min(1, "Bird count required").max(50000, "Too many"),
    wasteAmount: z.number().min(0).optional(),
    costPerKg: z.number().min(0).optional(),
    notes: z.string().optional(),
});

export type FeedDistributionFormData = z.infer<typeof feedDistributionSchema>;

interface FeedDistributionFormProps {
    onSubmit: (
        data: FeedDistributionData & {
            targetSection: string;
            birdCount: number;
        }
    ) => void;
    onCancel: () => void;
    initialData?: Partial<
        FeedDistributionData & { targetSection: string; birdCount: number }
    >;
    isLoading?: boolean;
}

export default function FeedDistributionForm({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: FeedDistributionFormProps) {
    const form = useForm<FeedDistributionFormData>({
        resolver: zodResolver(feedDistributionSchema),
        defaultValues: {
            feedType: initialData?.feedType || "Layer Mash",
            quantityKg: initialData?.quantityKg || 0,
            feedingTime:
                initialData?.feedingTime ||
                new Date().toTimeString().slice(0, 5),
            distributionMethod:
                (initialData?.distributionMethod as any) || "manual",
            feedQuality: (initialData?.feedQuality as any) || "good",
            targetSection:
                (initialData as any)?.targetSection || FARM_SECTIONS[0],
            birdCount: (initialData as any)?.birdCount || 1000,
            wasteAmount: initialData?.wasteAmount || 0,
            costPerKg: initialData?.costPerKg || undefined,
        } as any,
    });

    useEffect(() => {
        if (!form.getValues("targetSection"))
            form.setValue("targetSection", FARM_SECTIONS[0]);
    }, [form]);

    const watched = form.watch();
    const consumptionRate =
        watched.birdCount > 0 && watched.quantityKg > 0
            ? watched.quantityKg / watched.birdCount
            : 0; // kg per bird
    const feedConversionRatio =
        watched.quantityKg > 0 && (initialData as any)?.weightGainKg
            ? watched.quantityKg / (initialData as any).weightGainKg
            : undefined;

    const handleSubmit = (data: FeedDistributionFormData) => {
        const submission: FeedDistributionData & {
            targetSection: string;
            birdCount: number;
        } = {
            feedType: data.feedType,
            quantityKg: data.quantityKg,
            feedingTime: data.feedingTime,
            distributionMethod: data.distributionMethod,
            feedQuality: data.feedQuality,
            wasteAmount: data.wasteAmount,
            consumptionRate, // derived
            feedConversionRatio, // possibly undefined
            costPerKg: data.costPerKg,
            targetSection: data.targetSection,
            birdCount: data.birdCount,
        } as any;
        onSubmit(submission);
    };

    const qualityColor = (q: string) => {
        switch (q) {
            case "excellent":
                return "bg-green-100 text-green-800";
            case "good":
                return "bg-yellow-100 text-yellow-800";
            case "poor":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Card
            data-cy="feed-distribution-form"
            className="w-full max-w-2xl mx-auto"
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                    Feed Distribution
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Record feed provided to each section with derived
                    consumption metrics
                </p>
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
                                name="feedType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feed Type *</FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="feed-type"
                                                placeholder="Layer Mash"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Type or formulation of feed
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantityKg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity (kg) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="quantity-kg"
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
                                        <FormDescription>
                                            Total kilograms of feed distributed
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="feedingTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feeding Time *</FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="feeding-time"
                                                type="time"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="distributionMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Distribution Method *
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger data-cy="distribution-method-trigger">
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="manual">
                                                    Manual
                                                </SelectItem>
                                                <SelectItem value="automatic">
                                                    Automatic
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="feedQuality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feed Quality *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger data-cy="feed-quality-trigger">
                                                    <SelectValue placeholder="Select quality" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="excellent">
                                                    <Badge
                                                        className={qualityColor(
                                                            "excellent"
                                                        )}
                                                    >
                                                        Excellent
                                                    </Badge>
                                                </SelectItem>
                                                <SelectItem value="good">
                                                    <Badge
                                                        className={qualityColor(
                                                            "good"
                                                        )}
                                                    >
                                                        Good
                                                    </Badge>
                                                </SelectItem>
                                                <SelectItem value="poor">
                                                    <Badge
                                                        className={qualityColor(
                                                            "poor"
                                                        )}
                                                    >
                                                        Poor
                                                    </Badge>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetSection"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Section *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={
                                                field.value || FARM_SECTIONS[0]
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger data-cy="target-section-trigger">
                                                    <SelectValue placeholder="Select section" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {FARM_SECTIONS.map((sec) => (
                                                    <SelectItem
                                                        key={sec}
                                                        value={sec}
                                                    >
                                                        {sec}
                                                    </SelectItem>
                                                ))}
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
                                name="birdCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bird Count *</FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="bird-count"
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
                                name="wasteAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Waste (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="waste-amount"
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
                                        <FormDescription>
                                            Leftover/spilled feed
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="costPerKg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Cost / kg (optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="cost-per-kg"
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

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            data-cy="feed-notes"
                                            placeholder="Observations or adjustments..."
                                            className="resize-none h-20"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {watched.quantityKg > 0 && watched.birdCount > 0 && (
                            <div className="bg-emerald-50 p-4 rounded-lg">
                                <h4 className="font-medium text-emerald-900 mb-2">
                                    Derived Metrics
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-emerald-700">
                                            Consumption Rate:
                                        </span>
                                        <span
                                            className="font-medium ml-2"
                                            data-cy="consumption-rate"
                                        >
                                            {consumptionRate.toFixed(4)} kg/bird
                                        </span>
                                    </div>
                                    {feedConversionRatio && (
                                        <div>
                                            <span className="text-emerald-700">
                                                Feed Conversion Ratio:
                                            </span>
                                            <span
                                                className="font-medium ml-2"
                                                data-cy="fcr-value"
                                            >
                                                {feedConversionRatio.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-6">
                            <Button
                                type="submit"
                                data-cy="submit-feed"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                {isLoading ? "Recording..." : "Record Feed"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="flex-1"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
