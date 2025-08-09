export type MortalityAlertLevel = "normal" | "warning" | "critical";

export interface MortalityThresholdConfig {
    warningCount: number; // count threshold for warning
    criticalCount: number; // count threshold for critical
    warningRate: number; // percentage (e.g. 1.0 => 1%)
    criticalRate: number; // percentage (e.g. 2.0 => 2%)
}

export const DEFAULT_MORTALITY_THRESHOLDS: MortalityThresholdConfig = {
    warningCount: 3,
    criticalCount: 5,
    warningRate: 1.0,
    criticalRate: 2.0,
};

export interface MortalityEvaluationResult {
    level: MortalityAlertLevel;
    rate: number; // percentage value (e.g. 1.25 => 1.25%)
}

/**
 * Evaluate mortality alert level and rate based on count & flock size.
 * Pure & side-effect free so it can be unit tested and reused server-side.
 */
export function evaluateMortality(
    count: number,
    flockSize: number,
    config: MortalityThresholdConfig = DEFAULT_MORTALITY_THRESHOLDS
): MortalityEvaluationResult {
    const safeFlock = flockSize > 0 ? flockSize : 0;
    const rate = safeFlock > 0 && count > 0 ? (count / safeFlock) * 100 : 0;

    let level: MortalityAlertLevel = "normal";
    if (count >= config.criticalCount || rate >= config.criticalRate) {
        level = "critical";
    } else if (count >= config.warningCount || rate >= config.warningRate) {
        level = "warning";
    }
    return { level, rate };
}
