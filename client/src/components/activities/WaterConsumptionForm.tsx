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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { WaterConsumptionData, FARM_SECTIONS } from "@shared/types/activities";
import { Droplets } from "lucide-react";

const schema = z.object({
    volumeLiters: z.number().min(0.1, "Volume must be > 0"),
    waterSource: z.string().min(1, "Source required"),
    qualityCheck: z.enum(["passed", "failed", "pending"]),
    temperature: z.number().min(0).max(60).optional(),
    pHLevel: z.number().min(0).max(14).optional(),
    chlorineLevel: z.number().min(0).max(10).optional(),
    systemPressure: z.number().min(0).optional(),
    issues: z.array(z.string()).optional(),
    location: z.string().min(1, "Location required"),
    birds: z.number().min(1, "Bird count required").optional(),
    notes: z.string().optional(),
});

export type WaterConsumptionFormData = z.infer<typeof schema>;

interface Props {
    onSubmit: (data: WaterConsumptionData) => void;
    onCancel: () => void;
    initialData?: Partial<WaterConsumptionData>;
    isLoading?: boolean;
}

export default function WaterConsumptionForm({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: Props) {
    const form = useForm<WaterConsumptionFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            volumeLiters: initialData?.volumeLiters || 0,
            waterSource: initialData?.waterSource || "",
            qualityCheck: initialData?.qualityCheck || "pending",
            temperature: initialData?.temperature,
            pHLevel: initialData?.pHLevel,
            chlorineLevel: initialData?.chlorineLevel,
            systemPressure: initialData?.systemPressure,
            location: (initialData as any)?.location || "",
            notes: "",
        },
    });

    const watched = form.watch();
    const consumptionRate =
        watched.birds && watched.volumeLiters
            ? +(watched.volumeLiters / watched.birds).toFixed(3)
            : undefined;

    const handleSubmit = (data: WaterConsumptionFormData) => {
        const submission: WaterConsumptionData = {
            volumeLiters: data.volumeLiters,
            waterSource: data.waterSource,
            qualityCheck: data.qualityCheck,
            temperature: data.temperature,
            pHLevel: data.pHLevel,
            chlorineLevel: data.chlorineLevel,
            systemPressure: data.systemPressure,
            issues: data.issues,
            consumptionRate,
        };
        onSubmit(submission);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-sky-600" />
                    Water Consumption
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
                                name="volumeLiters"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Volume (L) *</FormLabel>
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
                            <FormField
                                control={form.control}
                                name="waterSource"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Borehole"
                                                {...field}
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
                                name="qualityCheck"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quality Check *</FormLabel>
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
                                                <SelectItem value="passed">
                                                    Passed
                                                </SelectItem>
                                                <SelectItem value="failed">
                                                    Failed
                                                </SelectItem>
                                                <SelectItem value="pending">
                                                    Pending
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="temperature"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temperature (°C)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.1"
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
                            <FormField
                                control={form.control}
                                name="pHLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>pH</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.1"
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
                                name="chlorineLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chlorine (ppm)</FormLabel>
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
                            <FormField
                                control={form.control}
                                name="systemPressure"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pressure (bar)</FormLabel>
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
                            <FormField
                                control={form.control}
                                name="birds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Birds</FormLabel>
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
                        </div>

                        {consumptionRate && (
                            <div className="text-sm text-muted-foreground">
                                Consumption Rate: {consumptionRate} L/bird
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select farm section" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {FARM_SECTIONS.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
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
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="Observations"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Water"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
