import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Egg,
    Wheat,
    Skull,
    DollarSign,
    TrendingUp,
    TrendingDown,
} from "lucide-react";

interface KpiCardsProps {
    metrics?: {
        eggProduction: number;
        feedConsumption: number;
        mortality: number;
        revenue: number;
    };
}

export default function KpiCards({ metrics }: KpiCardsProps) {
    const cards = [
        {
            title: "Eggs Collected Today",
            value: metrics?.eggProduction || 0,
            target: 2500,
            icon: Egg,
            color: "primary",
            trend: metrics?.eggProduction
                ? metrics.eggProduction > 2500
                    ? "up"
                    : "down"
                : "neutral",
            percentage: metrics?.eggProduction
                ? Math.round(((metrics.eggProduction - 2500) / 2500) * 100)
                : 0,
        },
        {
            title: "Feed Consumed",
            value: `${metrics?.feedConsumption || 0}kg`,
            target: "865kg avg",
            icon: Wheat,
            color: "secondary",
            trend: metrics?.feedConsumption
                ? parseFloat(metrics.feedConsumption.toString()) < 865
                    ? "down"
                    : "up"
                : "neutral",
            percentage: metrics?.feedConsumption
                ? Math.round(
                      ((parseFloat(metrics.feedConsumption.toString()) - 865) /
                          865) *
                          100
                  )
                : 0,
        },
        {
            title: "Mortality Today",
            value: metrics?.mortality || 0,
            target: "Threshold: 5",
            icon: Skull,
            color: "warning",
            trend: metrics?.mortality
                ? metrics.mortality > 5
                    ? "up"
                    : "down"
                : "neutral",
            percentage: 0,
            alert: metrics?.mortality && metrics.mortality > 5,
        },
        {
            title: "Daily Revenue",
            value: `₦${metrics?.revenue?.toLocaleString() || 0}`,
            target: "Monthly: ₦127,890",
            icon: DollarSign,
            color: "success",
            trend: "up",
            percentage: 8,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
            {cards.map((card) => {
                const Icon = card.icon;
                const TrendIcon =
                    card.trend === "up" ? TrendingUp : TrendingDown;

                return (
                    <Card key={card.title} className="bg-white">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                                        card.color === "primary"
                                            ? "bg-primary/10"
                                            : card.color === "secondary"
                                            ? "bg-secondary/10"
                                            : card.color === "warning"
                                            ? "bg-warning/10"
                                            : card.color === "success"
                                            ? "bg-success/10"
                                            : "bg-slate-100"
                                    }`}
                                >
                                    <Icon
                                        className={`text-lg sm:text-xl ${
                                            card.color === "primary"
                                                ? "text-primary"
                                                : card.color === "secondary"
                                                ? "text-secondary"
                                                : card.color === "warning"
                                                ? "text-warning"
                                                : card.color === "success"
                                                ? "text-success"
                                                : "text-slate-600"
                                        }`}
                                    />
                                </div>

                                {card.alert ? (
                                    <Badge
                                        variant="destructive"
                                        className="text-xs"
                                    >
                                        HIGH
                                    </Badge>
                                ) : (
                                    card.percentage !== 0 && (
                                        <Badge
                                            variant={
                                                card.trend === "up"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className={`text-xs ${
                                                card.trend === "up"
                                                    ? "bg-success/10 text-success"
                                                    : "bg-accent/10 text-accent"
                                            }`}
                                        >
                                            <TrendIcon className="w-3 h-3 mr-1" />
                                            {Math.abs(card.percentage)}%
                                        </Badge>
                                    )
                                )}
                            </div>

                            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 font-mono mb-1">
                                {card.value}
                            </h3>
                            <p className="text-slate-600 text-xs sm:text-sm mb-2">
                                {card.title}
                            </p>
                            <div className="text-xs text-slate-500">
                                {card.target}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
