import {
    evaluateMortality,
    DEFAULT_MORTALITY_THRESHOLDS,
} from "../../shared/alerts/mortality";

describe("evaluateMortality utility", () => {
    it("returns normal for zero count", () => {
        const res = evaluateMortality(0, 1000);
        expect(res.level).to.eq("normal");
        expect(res.rate).to.eq(0);
    });

    it("warning by count threshold", () => {
        const res = evaluateMortality(
            DEFAULT_MORTALITY_THRESHOLDS.warningCount,
            5000
        );
        expect(res.level).to.eq("warning");
    });

    it("critical by count threshold", () => {
        const res = evaluateMortality(
            DEFAULT_MORTALITY_THRESHOLDS.criticalCount,
            5000
        );
        expect(res.level).to.eq("critical");
    });

    it("warning by rate threshold (>=1%)", () => {
        // 1 bird out of 90 ~= 1.11%
        const res = evaluateMortality(1, 90);
        expect(res.level).to.eq("warning");
    });

    it("critical by rate threshold (>=2%)", () => {
        // 1 bird out of 40 = 2.5%
        const res = evaluateMortality(1, 40);
        expect(res.level).to.eq("critical");
    });

    it("respects custom thresholds", () => {
        const custom = {
            warningCount: 2,
            criticalCount: 4,
            warningRate: 0.5,
            criticalRate: 1.0,
        };
        expect(evaluateMortality(1, 1000, custom).level).to.eq("normal");
        expect(evaluateMortality(2, 1000, custom).level).to.eq("warning");
        expect(evaluateMortality(4, 1000, custom).level).to.eq("critical");
    });

    it("handles zero flock size (rate 0 but count triggers)", () => {
        const res = evaluateMortality(
            DEFAULT_MORTALITY_THRESHOLDS.criticalCount,
            0
        );
        expect(res.rate).to.eq(0);
        expect(res.level).to.eq("critical");
    });
});
