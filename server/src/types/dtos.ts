// Shared DTOs between routes and services

export type RecipeIngredientDTO = {
  ingredient_id: number;
  percentage: number;
};

export type RecipeCreateDTO = {
  recipe_name: string;
  ingredients: RecipeIngredientDTO[];
  other_ingredients?: any;
};

export type RecipeUpdateDTO = Partial<RecipeCreateDTO> & {
  is_active?: boolean;
};

export type BatchIngredientDTO = {
  ingredient_id?: number;
  ingredient_name: string;
  amount_kg: number;
  cost_per_kg: number;
};

export type BatchCreateDTO = {
  batch_date: string;
  batch_size_kg: number;
  recipe_id?: number;
  ingredients: BatchIngredientDTO[];
};

export type IngredientCreateDTO = {
  name: string;
  unit?: string;
  price_per_unit?: number | string;
  supplier?: string;
  nutritional_info?: string;
};

export type IngredientUpdateDTO = Partial<IngredientCreateDTO>;

export default {};

// Daily activity DTOs
export type DailyActivityCreateDTO = {
  log_date: string;
  house_id?: number;
  eggs_total?: number;
  eggs_grade_a?: number;
  eggs_grade_b?: number;
  eggs_grade_c?: number;
  feed_given_kg?: number;
  mortality_count?: number;
  notes?: string;
  supervisor_id?: number;
};

export type DailyActivityUpdateDTO = Partial<DailyActivityCreateDTO>;

// Customers
export type CustomerCreateDTO = {
  customer_name: string;
  phone?: string;
  email?: string;
  address?: string;
  preferred_contact?: "phone" | "email";
};

export type CustomerUpdateDTO = Partial<CustomerCreateDTO> & {
  is_active?: boolean;
};

// Sales
export type SaleCreateDTO = {
  sale_date: string;
  customer_id?: number;
  grade_a_qty: number;
  grade_a_price: number;
  grade_b_qty: number;
  grade_b_price: number;
  grade_c_qty: number;
  grade_c_price: number;
  payment_method: "cash" | "transfer" | "check";
  payment_status?: "paid" | "pending";
  supervisor_id?: number;
  total_amount?: number;
};

export type SaleUpdateDTO = Partial<SaleCreateDTO>;

// Houses
export type HouseCreateDTO = {
  house_name: string;
  capacity: number;
  current_bird_count?: number;
};

export type HouseUpdateDTO = Partial<HouseCreateDTO>;

// Labor management DTOs
export type LaborerCreateDTO = {
  employee_id?: string;
  full_name: string;
  phone?: string;
  address?: string;
  position?: string;
  monthly_salary: number; // monthly salary
  hire_date: string; // YYYY-MM-DD
  is_active?: boolean;
  emergency_contact?: string;
  emergency_phone?: string;
};

export type LaborerUpdateDTO = Partial<LaborerCreateDTO>;

export type WorkAssignmentCreateDTO = {
  laborer_id: number;
  work_date: string; // YYYY-MM-DD
  tasks_assigned?: string[]; // array of task descriptions
  attendance_status?: "present" | "absent" | "half_day" | "late";
  performance_notes?: string;
  supervisor_id?: number;
};

export type WorkAssignmentUpdateDTO = Partial<WorkAssignmentCreateDTO>;

export type PayrollCreateDTO = {
  month_year: string; // YYYY-MM
  laborer_id: number;
  base_salary?: number;
  days_worked?: number;
  days_absent?: number;
  salary_deductions?: number;
  bonus_amount?: number;
  final_salary?: number;
  payment_date?: string; // YYYY-MM-DD
  payment_status?: "pending" | "paid";
  notes?: string;
};

export type PayrollUpdateDTO = Partial<PayrollCreateDTO>;
