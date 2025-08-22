import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MortalityData, FARM_SECTIONS } from "@shared/types/activities";
import { AlertTriangle, Heart, Camera, FileText } from "lucide-react";
import {
    evaluateMortality,
    MortalityThresholdConfig,
} from "@shared/alerts/mortality";

const mortalitySchema = z.object({
    count: z
        .number()
        .min(0, "Count cannot be negative")
        .max(1000, "Count seems too high"),
    suspectedCause: z.enum(
        [
            "disease",
            "injury",
            "natural",
            "unknown",
            "predator",
            "environmental",
        ],
        {
            required_error: "Please select suspected cause",
        }
    ),
    affectedCoop: z.string().min(1, "Affected coop is required"),
    symptoms: z.array(z.string()).optional(),
    disposalMethod: z.string().min(1, "Disposal method is required"),
    vetNotified: z.boolean(),
    ageGroup: z.enum(["chicks", "pullets", "layers", "breeders"]).optional(),
    notes: z.string().optional(),
    temperatureC: z.number().min(-10).max(60).optional(),
    humidityPct: z.number().min(0).max(100).optional(),
    conditions: z.enum(["clear", "cloudy", "rain", "storm", "hot", "cold"]).optional(),
});

type MortalityFormData = z.infer<typeof mortalitySchema>;

interface MortalityFormProps {
    onSubmit: (data: MortalityData) => void;
    onCancel: () => void;
    initialData?: Partial<MortalityData>;
    isLoading?: boolean;
    totalFlockSize?: number; // For calculating mortality rate
    mortalityThresholds?: MortalityThresholdConfig; // configurable thresholds
}

const COMMON_SYMPTOMS = [
    "Lethargy",
    "Loss of appetite",
    "Difficulty breathing",
    "Diarrhea",
    "Discharge from eyes/nose",
    "Unusual posture",
    "Paralysis",
    "Swelling",
    "Discoloration",
    "Abnormal behavior",
];

const DISPOSAL_METHODS = [
    "Incineration",
    "Burial",
    "Composting",
    "Rendering",
    "Veterinary disposal",
];

export default function MortalityForm({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
    totalFlockSize = 1000,
    mortalityThresholds,
}: MortalityFormProps) {
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
        initialData?.symptoms || []
    );
    const [alertLevel, setAlertLevel] = useState<
        "normal" | "warning" | "critical"
    >("normal");

    const form = useForm<MortalityFormData>({
        resolver: zodResolver(mortalitySchema),
        defaultValues: {
            count: initialData?.count || 0,
            suspectedCause: initialData?.suspectedCause || "unknown",
            affectedCoop: initialData?.affectedCoop || FARM_SECTIONS[0], // non-empty default
            symptoms: selectedSymptoms,
            disposalMethod:
                initialData?.disposalMethod ||
                DISPOSAL_METHODS[0] ||
                "Incineration",
            vetNotified: initialData?.vetNotified || false,
            ageGroup: initialData?.ageGroup || "layers",
            notes: "",
            temperatureC: initialData?.temperatureC,
            humidityPct: initialData?.humidityPct,
            conditions: initialData?.conditions,
        },
    });

    useEffect(() => {
        if (!form.getValues("affectedCoop")) {
            form.setValue("affectedCoop", FARM_SECTIONS[0]);
        }
        if (!form.getValues("suspectedCause")) {
            form.setValue("suspectedCause", "unknown");
        }
        if (!form.getValues("disposalMethod")) {
            form.setValue(
                "disposalMethod",
                DISPOSAL_METHODS[0] || "Incineration"
            );
        }
        if (!form.getValues("ageGroup")) {
            form.setValue("ageGroup", "layers");
        }
    }, [form]);

    const watchedCount = form.watch("count");

    // Calculate mortality rate and alert level reactively
    useEffect(() => {
        const { level } = evaluateMortality(
            watchedCount,
            totalFlockSize,
            mortalityThresholds
        );
        setAlertLevel(level);
    }, [watchedCount, totalFlockSize, mortalityThresholds]);

    const handleSymptomToggle = (symptom: string, checked: boolean) => {
        let updatedSymptoms;
        if (checked) {
            updatedSymptoms = [...selectedSymptoms, symptom];
        } else {
            updatedSymptoms = selectedSymptoms.filter((s) => s !== symptom);
        }
        setSelectedSymptoms(updatedSymptoms);
        form.setValue("symptoms", updatedSymptoms);
    };

    const handleSubmit = (data: MortalityFormData) => {
        const mortalityRate =
            totalFlockSize > 0 ? (data.count / totalFlockSize) * 100 : 0;

        const submissionData: MortalityData = {
            ...data,
            symptoms: selectedSymptoms,
            mortalityRate: Math.round(mortalityRate * 100) / 100, // Round to 2 decimal places
            trends: alertLevel === "critical" ? "increasing" : "stable",
        };
        onSubmit(submissionData);
    };

    const getCauseColor = (cause: string) => {
        switch (cause) {
            case "disease":
                return "bg-red-100 text-red-800";
            case "injury":
                return "bg-orange-100 text-orange-800";
            case "natural":
                return "bg-blue-100 text-blue-800";
            case "predator":
                return "bg-purple-100 text-purple-800";
            case "environmental":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getAlertContent = () => {
        const mortalityRate =
            totalFlockSize > 0 ? (watchedCount / totalFlockSize) * 100 : 0;

        switch (alertLevel) {
            case "critical":
                return {
                    color: "destructive" as const,
                    title: "Critical Alert",
                    message: `High mortality detected (${watchedCount} birds, ${mortalityRate.toFixed(
                        1
                    )}%). Management will be notified immediately.`,
                };
            case "warning":
                return {
                    color: "default" as const,
                    title: "Warning",
                    message: `Elevated mortality (${watchedCount} birds, ${mortalityRate.toFixed(
                        1
                    )}%). Monitor closely.`,
                };
            default:
                return null;
        }
    };

    const alertContent = getAlertContent();

    return (
        <Card data-cy="mortality-form" className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Mortality Record
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Record bird mortality with detailed cause analysis and
                    disposal tracking
                </p>
            </CardHeader>
            <CardContent>
                {alertContent && (
                    <Alert variant={alertContent.color} className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>{alertContent.title}:</strong>{" "}
                            {alertContent.message}
                        </AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Heart className="w-4 h-4" />
                                            Number of Deaths *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="mortality-count-input"
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
                                            Total number of birds that died
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="affectedCoop"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Affected Location *
                                        </FormLabel>
                                        <Select
                                            data-cy="affected-coop"
                                            onValueChange={field.onChange}
                                            value={
                                                field.value || FARM_SECTIONS[0]
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger data-cy="affected-coop-trigger">
                                                    <SelectValue placeholder="Select location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {FARM_SECTIONS.map(
                                                    (section) => (
                                                        <SelectItem
                                                            key={section}
                                                            value={section}
                                                        >
                                                            {section}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Cause and Age Group */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="suspectedCause"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Suspected Cause *</FormLabel>
                                        <Select
                                            data-cy="suspected-cause"
                                            onValueChange={field.onChange}
                                            value={field.value || "unknown"}
                                        >
                                            <FormControl>
                                                <SelectTrigger data-cy="suspected-cause-trigger">
                                                    <SelectValue placeholder="Select cause" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="disease">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getCauseColor(
                                                                "disease"
                                                            )}
                                                        >
                                                            Disease
                                                        </Badge>
                                                        Illness or infection
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="injury">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getCauseColor(
                                                                "injury"
                                                            )}
                                                        >
                                                            Injury
                                                        </Badge>
                                                        Physical trauma
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="natural">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getCauseColor(
                                                                "natural"
                                                            )}
                                                        >
                                                            Natural
                                                        </Badge>
                                                        Age or natural causes
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="predator">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getCauseColor(
                                                                "predator"
                                                            )}
                                                        >
                                                            Predator
                                                        </Badge>
                                                        Predator attack
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="environmental">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getCauseColor(
                                                                "environmental"
                                                            )}
                                                        >
                                                            Environment
                                                        </Badge>
                                                        Weather or conditions
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="unknown">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={getCauseColor(
                                                                "unknown"
                                                            )}
                                                        >
                                                            Unknown
                                                        </Badge>
                                                        Cause unclear
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ageGroup"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Age Group</FormLabel>
                                        <Select
                                            data-cy="age-group"
                                            onValueChange={field.onChange}
                                            value={field.value || "layers"}
                                        >
                                            <FormControl>
                                                <SelectTrigger data-cy="age-group-trigger">
                                                    <SelectValue placeholder="Select age group" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="chicks">
                                                    Chicks (0-8 weeks)
                                                </SelectItem>
                                                <SelectItem value="pullets">
                                                    Pullets (8-18 weeks)
                                                </SelectItem>
                                                <SelectItem value="layers">
                                                    Layers (18+ weeks)
                                                </SelectItem>
                                                <SelectItem value="breeders">
                                                    Breeders
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Symptoms */}
                        <div>
                            <FormLabel className="text-base font-medium">
                                Observed Symptoms
                            </FormLabel>
                            <FormDescription className="mb-3">
                                Select all symptoms that were observed before
                                death
                            </FormDescription>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {COMMON_SYMPTOMS.map((symptom) => (
                                    <div
                                        key={symptom}
                                        className="flex items-center space-x-2"
                                    >
                                        <Checkbox
                                            id={`symptom-${symptom}`}
                                            checked={selectedSymptoms.includes(
                                                symptom
                                            )}
                                            onCheckedChange={(checked) =>
                                                handleSymptomToggle(
                                                    symptom,
                                                    checked as boolean
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor={`symptom-${symptom}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {symptom}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Disposal Method */}
                        <FormField
                            control={form.control}
                            name="disposalMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Disposal Method *</FormLabel>
                                    <Select
                                        data-cy="disposal-method"
                                        onValueChange={field.onChange}
                                        value={
                                            field.value ||
                                            DISPOSAL_METHODS[0] ||
                                            "Incineration"
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger data-cy="disposal-method-trigger">
                                                <SelectValue placeholder="Select disposal method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {DISPOSAL_METHODS.map((method) => (
                                                <SelectItem
                                                    key={method}
                                                    value={method}
                                                >
                                                    {method}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        How were the deceased birds disposed of?
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Veterinarian Notification */}
                        <FormField
                            control={form.control}
                            name="vetNotified"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            data-cy="vet-notified"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Veterinarian Notified
                                        </FormLabel>
                                        <FormDescription>
                                            Check if the farm veterinarian has
                                            been contacted about this mortality
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Additional Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Additional Notes
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional observations, circumstances leading to death, or other relevant information..."
                                            className="resize-none h-24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Any additional details that might help
                                        understand the cause or prevent future
                                        occurrences
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Environmental Conditions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="temperatureC"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temperature (°C)</FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="temp-input"
                                                type="number"
                                                step="0.1"
                                                placeholder="24.5"
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
                                            Ambient temperature
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="humidityPct"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Humidity (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                data-cy="humidity-input"
                                                type="number"
                                                step="1"
                                                placeholder="65"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        parseInt(
                                                            e.target.value
                                                        ) || undefined
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Relative humidity
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="conditions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Conditions</FormLabel>
                                        <Select
                                            data-cy="conditions-select"
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger data-cy="conditions-trigger">
                                                    <SelectValue placeholder="Select conditions" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="clear">Clear</SelectItem>
                                                <SelectItem value="cloudy">Cloudy</SelectItem>
                                                <SelectItem value="rain">Rain</SelectItem>
                                                <SelectItem value="storm">Storm</SelectItem>
                                                <SelectItem value="hot">Hot</SelectItem>
                                                <SelectItem value="cold">Cold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Weather/environment state
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Mortality Rate Display */}
                        {watchedCount > 0 && (
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-medium text-slate-900 mb-2">
                                    Mortality Analysis
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-700">
                                            Daily Rate:
                                        </span>
                                        <span className="font-medium ml-2">
                                            {(
                                                (watchedCount /
                                                    totalFlockSize) *
                                                100
                                            ).toFixed(2)}
                                            %
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-700">
                                            Alert Level:
                                        </span>
                                        <Badge
                                            data-cy="mortality-alert-badge"
                                            data-alert-level={alertLevel}
                                            className={`ml-2 ${
                                                alertLevel === "critical"
                                                    ? "bg-red-100 text-red-800"
                                                    : alertLevel === "warning"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-green-100 text-green-800"
                                            }`}
                                        >
                                            {alertLevel === "critical"
                                                ? "Critical"
                                                : alertLevel === "warning"
                                                ? "Warning"
                                                : "Normal"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6">
                            <Button
                                type="submit"
                                data-cy="submit-mortality"
                                className="flex-1 bg-red-600 hover:bg-red-700"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Recording..."
                                    : "Record Mortality"}
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
