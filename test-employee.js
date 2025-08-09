// Test script to debug employee creation
const testEmployeeData = {
    employeeId: "EMP001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@farm.com",
    phone: "555-0123",
    address: "123 Farm Road",
    role: "Farm Worker",
    department: "Operations",
    startDate: "2024-01-15",
    employmentType: "full_time",
    baseSalary: 45000,
    payGrade: "L1",
};

console.log("Test employee data:", JSON.stringify(testEmployeeData, null, 2));

// Test the validation schema
import { insertEmployeeSchema } from "../shared/schema.js";

try {
    const validated = insertEmployeeSchema.parse(testEmployeeData);
    console.log("Validation successful:", validated);
} catch (error) {
    console.error("Validation failed:", error.errors);
}
