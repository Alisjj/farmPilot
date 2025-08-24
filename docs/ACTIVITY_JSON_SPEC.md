# Activity JSON Specification

This document standardizes the JSON shapes stored in `daily_activities.data` so the application and reporting views (materialized views) can reliably extract fields.

Key activity types and expected JSON fields (examples):

- egg_collection

  - quantity: number (total eggs collected)
  - qualityGrade: "A" | "B" | "C" | "Cracked"
  - coopLocation: string (match `FARM_SECTIONS` or house name)
  - collectionTime: ISO datetime string
  - collectorsCount: number

- feed_distribution

  - feedType: string
  - quantityKg: number
  - feedingTime: ISO datetime
  - distributionMethod: "automatic" | "manual"
  - costPerKg?: number

- mortality

  - count: number
  - affectedCoop: string
  - suspectedCause: string

- egg_sales
  - quantity: number
  - pricePerDozen: number
  - totalRevenue: number
  - buyer: string
  - qualityGrade: "A" | "B" | "C"
  - paymentStatus: "pending" | "paid" | "overdue"

Notes

- All timestamps should be stored in the `timestamp` column of `daily_activities` and not only inside `data`.
- Where possible, prefer `farm_section` column for consistent coop/house names. If `coopLocation` exists inside `data`, the materialized view will prefer `farm_section` and fall back to `coopLocation`.
- Keep JSON field names exact to the interfaces defined in `shared/types/activities.ts`.
