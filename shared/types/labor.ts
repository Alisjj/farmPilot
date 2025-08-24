// Labor Management Types
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { laborers, daily_work_assignments, monthly_payroll } from "../schema";

// Laborer Types
export type Laborer = InferSelectModel<typeof laborers>;
export type NewLaborer = InferInsertModel<typeof laborers>;

// Daily Work Assignment Types
export type DailyWorkAssignment = InferSelectModel<
  typeof daily_work_assignments
>;
export type NewDailyWorkAssignment = InferInsertModel<
  typeof daily_work_assignments
>;

// Monthly Payroll Types
export type MonthlyPayroll = InferSelectModel<typeof monthly_payroll>;
export type NewMonthlyPayroll = InferInsertModel<typeof monthly_payroll>;

// Attendance Status Enum
export type AttendanceStatus = "present" | "absent" | "half_day" | "late";

// Payment Status Enum
export type PaymentStatus = "pending" | "paid";

// Position Types
export type LaborerPosition =
  | "General Laborer"
  | "Feed Specialist"
  | "Cleaning Specialist"
  | "Security Guard"
  | "Supervisor"
  | "Other";

// Task Types
export type WorkTask =
  | "collection"
  | "feeding"
  | "cleaning"
  | "feed_preparation"
  | "maintenance"
  | "security"
  | "administration"
  | "other";

// Payroll Calculation Interface
export interface PayrollCalculation {
  laborerId: number;
  monthYear: string; // YYYY-MM-DD format (first day of month)
  baseSalary: number;
  daysWorked: number;
  daysAbsent: number;
  salaryDeductions: number;
  bonusAmount: number;
  finalSalary: number;
  paymentStatus: PaymentStatus;
  notes?: string;
}

// Payroll Summary Interface
export interface PayrollSummary {
  monthYear: string;
  totalLaborers: number;
  totalBaseSalaries: number;
  totalDeductions: number;
  totalBonuses: number;
  totalFinalSalaries: number;
  paidCount: number;
  pendingCount: number;
}

// Labor Cost Breakdown
export interface LaborCostBreakdown {
  date: string;
  totalLaborCost: number;
  laborCostPerEgg: number;
  activeWorkers: number;
  averageDailyCost: number;
}

// Work Assignment Summary
export interface WorkAssignmentSummary {
  date: string;
  totalWorkers: number;
  presentWorkers: number;
  absentWorkers: number;
  lateWorkers: number;
  halfDayWorkers: number;
  attendanceRate: number; // percentage
  taskCompletionSummary: {
    [task: string]: number; // count of workers assigned to each task
  };
}

// Laborer Performance Report
export interface LaborerPerformance {
  laborerId: number;
  laborerName: string;
  position: string;
  period: {
    start: string;
    end: string;
  };
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    attendanceRate: number;
  };
  performanceNotes: string[];
  bonusEarned: number;
}

// Payroll Generation Request
export interface PayrollGenerationRequest {
  monthYear: string; // YYYY-MM-DD format
  includeBonus?: boolean;
  bonusRules?: {
    perfectAttendanceBonus?: number;
    performanceBonus?: number;
  };
  deductionRules?: {
    absentDayDeduction?: boolean;
    lateDeduction?: number;
  };
}

// Labor Management Dashboard Data
export interface LaborDashboardData {
  summary: {
    totalActiveWorkers: number;
    totalMonthlyPayroll: number;
    currentMonthAttendanceRate: number;
    pendingPayments: number;
  };
  todayAttendance: WorkAssignmentSummary;
  monthlyPayrollSummary: PayrollSummary;
  recentPerformanceIssues: string[];
  upcomingPayments: {
    laborerName: string;
    amount: number;
    dueDate: string;
  }[];
}
