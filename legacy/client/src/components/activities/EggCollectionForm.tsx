import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { EggCollectionData, FARM_SECTIONS } from "@shared/types/activities";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Egg } from "lucide-react";

const eggCollectionSchema = z.object({
    quantity: z
        .number()
        .min(0, "Quantity must be positive")
        .max(10000, "Quantity seems to high"),
    qualityGrade: z.enum(["A", "B", "C", "Cracked"], {
        required_error: "Please select egg quality grade",
    }),
    coopLocation: z.string().min(1, "Coop location is required"),
    collectionTime: z.string().min(1, "Collection time is required"),
    collectorsCount: z
        .number()
        .min(1, "At least one collector is required")
        .max(10, "Too many collectors"),
    averageWeight: z.number().min(0).max(100).optional(),
    crackedCount: z.number().min(0).optional(),
    doubleYolkCount: z.number().min(0).optional(),
    notes: z.string().optional(),
});

type EggCollectionFormData = z.infer<typeof eggCollectionSchema>;

interface EggCollectionFormProps {
    onSubmit: (data: EggCollectionData) => void;
    onCancel: () => void;
    initialData?: Partial<EggCollectionData>;
    isLoading?: boolean;
}

export default function EggCollectionForm({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: EggCollectionFormProps) {
    const [calculatedMetrics, setCalculatedMetrics] = useState({
        eggsPerHour: 0,
        qualityPercentage: 0,
    });

    const form = useForm<EggCollectionFormData>({
        resolver: zodResolver(eggCollectionSchema),
        defaultValues: {
            quantity: initialData?.quantity || 0,
            qualityGrade: initialData?.qualityGrade || "A",
            coopLocation: initialData?.coopLocation || FARM_SECTIONS[0], // ensure non-empty default to satisfy Select
            collectionTime:
                initialData?.collectionTime ||
                new Date().toTimeString().slice(0, 5),
            collectorsCount: initialData?.collectorsCount || 1,
            averageWeight: initialData?.averageWeight || undefined,
            crackedCount: initialData?.crackedCount || 0,
            doubleYolkCount: initialData?.doubleYolkCount || 0,
            notes: "",
        },
    });

    useEffect(() => {
        if (!form.getValues("coopLocation")) {
            form.setValue("coopLocation", FARM_SECTIONS[0]);
        }
        if (!form.getValues("qualityGrade")) {
            form.setValue("qualityGrade", "A");
        }
    }, [form]);

    const watchedValues = form.watch();

    // Calculate metrics when form values change
    useState(() => {
        const calculateMetrics = () => {
            const {
                quantity,
                collectorsCount,
                crackedCount = 0,
            } = watchedValues;

            if (quantity && collectorsCount) {
                // Assume 1 hour collection time for calculation
                const eggsPerHour = Math.round(
                    (quantity / collectorsCount) * 60
                ); // per collector per hour
                const qualityPercentage =
                    quantity > 0
                        ? Math.round(
                              ((quantity - crackedCount) / quantity) * 100
                          )
                        : 0;

                setCalculatedMetrics({
                    eggsPerHour,
                    qualityPercentage,
                });
            }
        };

        calculateMetrics();
    });

    const handleSubmit = (data: EggCollectionFormData) => {
        const submissionData: EggCollectionData = {
            ...data,
            eggsPerHour: calculatedMetrics.eggsPerHour,
        };
        onSubmit(submissionData);
    };

    const getQualityGradeColor = (grade: string) => {
        switch (grade) {
            case "A":
                return "bg-green-100 text-green-800";
            case "B":
                return "bg-yellow-100 text-yellow-800";
            case "C":
                return "bg-orange-100 text-orange-800";
            case "Cracked":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Card
            data-cy="egg-collection-form"
            className="w-full max-w-2xl mx-auto"
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Egg className="w-5 h-5 text-orange-600" />
                    Egg Collection Record
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Record daily egg collection with quality assessment and
                    productivity metrics
                </p>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Egg className="w-4 h-4" />
                                            Total Quantity *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="quantity-input"
                                                type="number"
                                                placeholder="0"
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
                                        <FormDescription>
                                            Total number of eggs collected
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="qualityGrade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quality Grade *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || "A"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select quality grade" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="A">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getQualityGradeColor(
                                                                "A"
                                                            )}
                                                        >
                                                            A
                                                        </Badge>
                                                        Premium Quality
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="B">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getQualityGradeColor(
                                                                "B"
                                                            )}
                                                        >
                                                            B
                                                        </Badge>
                                                        Standard Quality
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="C">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getQualityGradeColor(
                                                                "C"
                                                            )}
                                                        >
                                                            C
                                                        </Badge>
                                                        Lower Quality
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="Cracked">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getQualityGradeColor(
                                                                "Cracked"
                                                            )}
                                                        >
                                                            Cracked
                                                        </Badge>
                                                        Damaged
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Location and Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="coopLocation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coop Location *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={
                                                field.value || FARM_SECTIONS[0]
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select coop location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {FARM_SECTIONS.filter(
                                                    (section) =>
                                                        section.includes(
                                                            "Coop"
                                                        ) ||
                                                        section.includes("Run")
                                                ).map((section) => (
                                                    <SelectItem
                                                        key={section}
                                                        value={section}
                                                    >
                                                        {section}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="collectionTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Collection Time *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="collection-time"
                                                type="time"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Time when collection started
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Collectors and Quality Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="collectorsCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Collectors *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="collectors-count"
                                                type="number"
                                                min="1"
                                                max="10"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Number of people collecting
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="crackedCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cracked Eggs</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="0"
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
                                        <FormDescription>
                                            Number of cracked eggs
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="doubleYolkCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Double Yolk</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="0"
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
                                        <FormDescription>
                                            Double yolk eggs found
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Optional Fields */}
                        <FormField
                            control={form.control}
                            name="averageWeight"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Average Weight (grams)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            placeholder="55.0"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || undefined
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Average weight per egg (optional)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Additional Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any observations, issues, or special notes about today's collection..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Optional notes about the collection
                                        process
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Calculated Metrics Display */}
                        {watchedValues.quantity > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">
                                    Calculated Metrics
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">
                                            Productivity:
                                        </span>
                                        <span className="font-medium ml-2">
                                            {calculatedMetrics.eggsPerHour}{" "}
                                            eggs/collector/hour
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">
                                            Quality Rate:
                                        </span>
                                        <span className="font-medium ml-2">
                                            {
                                                calculatedMetrics.qualityPercentage
                                            }
                                            % good eggs
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6">
                            <Button
                                type="submit"
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Record Collection"}
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
