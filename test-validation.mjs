import { insertEmployeeSchema } from "./shared/schema.js";

const testEmployee = {
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

try {
    const result = insertEmployeeSchema.parse(testEmployee);
    console.log("✅ Validation successful:", result);
} catch (error) {
    console.error("❌ Validation failed:");
    error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
}
