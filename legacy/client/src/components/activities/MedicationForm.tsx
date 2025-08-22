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
import { MedicationData, FARM_SECTIONS } from "@shared/types/activities";
import { Syringe } from "lucide-react";

const schema = z.object({
    medicationType: z.string().min(1, "Medication type required"),
    dosage: z.string().min(1, "Dosage required"),
    administrationMethod: z.enum(
        ["water", "feed", "injection", "spray", "oral"],
        { required_error: "Administration method required" }
    ),
    treatedBirds: z.number().min(1, "Treated birds required"),
    withdrawalPeriod: z.number().min(0).max(120),
    reasonForTreatment: z.string().min(2),
    vetPrescription: z.boolean().default(false),
    batchNumber: z.string().optional(),
    expirationDate: z.string().optional(),
    costPerDose: z.number().min(0).optional(),
    treatmentDuration: z.number().min(0).max(60).optional(),
    location: z.string().min(1, "Location required"),
    notes: z.string().optional(),
});

export type MedicationFormData = z.infer<typeof schema>;

interface Props {
    onSubmit: (data: MedicationData) => void;
    onCancel: () => void;
    initialData?: Partial<MedicationData>;
    isLoading?: boolean;
}

export default function MedicationForm({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: Props) {
    const form = useForm<MedicationFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            medicationType: initialData?.medicationType || "",
            dosage: initialData?.dosage || "",
            administrationMethod: initialData?.administrationMethod || "water",
            treatedBirds: initialData?.treatedBirds || 0,
            withdrawalPeriod: initialData?.withdrawalPeriod || 0,
            reasonForTreatment: initialData?.reasonForTreatment || "",
            vetPrescription: initialData?.vetPrescription || false,
            batchNumber: initialData?.batchNumber,
            expirationDate: initialData?.expirationDate,
            costPerDose: initialData?.costPerDose,
            treatmentDuration: initialData?.treatmentDuration,
            location: (initialData as any)?.location || "",
            notes: "",
        },
    });

    const handleSubmit = (data: MedicationFormData) => {
        const submission: MedicationData = { ...data };
        onSubmit(submission);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-indigo-600" />
                    Medication Record
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
                                name="medicationType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Medication *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Oxytetracycline"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dosage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dosage *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 1g/L"
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
                                name="administrationMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Method *</FormLabel>
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
                                                <SelectItem value="water">
                                                    Water
                                                </SelectItem>
                                                <SelectItem value="feed">
                                                    Feed
                                                </SelectItem>
                                                <SelectItem value="injection">
                                                    Injection
                                                </SelectItem>
                                                <SelectItem value="spray">
                                                    Spray
                                                </SelectItem>
                                                <SelectItem value="oral">
                                                    Oral
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="treatedBirds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Treated Birds *</FormLabel>
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
                                name="withdrawalPeriod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Withdrawal (days)</FormLabel>
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
                                        <FormDescription>
                                            Days until products are safe
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="batchNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Batch #</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="expirationDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expiration</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="costPerDose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost / Dose</FormLabel>
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

                        <FormField
                            control={form.control}
                            name="reasonForTreatment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="Symptoms / justification"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                            placeholder="Additional details"
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
                                {isLoading ? "Saving..." : "Save Medication"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
