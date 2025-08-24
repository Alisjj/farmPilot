import { SafeParseReturnType, ZodError } from "zod";

// Helper: if safeParse returned an error, throw the ZodError so centralized
// errorHandler can format it consistently. Otherwise return the parsed data.
export function throwIfInvalid<T>(result: SafeParseReturnType<T, any>): T {
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

export default throwIfInvalid;
