import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { customers, sales } from "../schema";

// Customer types
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type UpdateCustomer = Partial<NewCustomer> & { id: number };

// Sales types
export type Sale = InferSelectModel<typeof sales>;
export type NewSale = InferInsertModel<typeof sales>;
export type UpdateSale = Partial<NewSale> & { id: number };

// Enhanced types with customer information
export type SaleWithCustomer = Sale & {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
};

// Sales summary and analytics types
export interface SalesSummary {
  total_sales: number;
  total_revenue: number;
  total_eggs: number;
  avg_sale_amount: number;
  grade_a_total: number;
  grade_b_total: number;
  grade_c_total: number;
  paid_sales: number;
  pending_sales: number;
}

export interface SalesReport {
  summary: SalesSummary;
  period: {
    start_date?: string;
    end_date?: string;
  };
}

// Customer analytics types
export interface CustomerSummary {
  id: number;
  customer_name: string;
  total_purchases: number;
  total_spent: number;
  last_purchase_date?: string;
  avg_purchase_amount: number;
  preferred_contact: string;
}

// Grade breakdown for sales
export interface GradeBreakdown {
  grade: "A" | "B" | "C";
  quantity: number;
  price_per_unit: number;
  total_amount: number;
}

export interface SaleBreakdown {
  sale_id: number;
  sale_date: string;
  customer_name?: string;
  grades: GradeBreakdown[];
  total_amount: number;
  payment_method: string;
  payment_status: string;
}

// Query parameter types
export interface SalesQueryParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  customer_id?: number;
  payment_status?: "paid" | "pending";
  limit?: number;
  offset?: number;
}

export interface CustomersQueryParams {
  search?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

// Form data types for frontend
export interface SaleFormData {
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
}

export interface CustomerFormData {
  customer_name: string;
  phone?: string;
  email?: string;
  address?: string;
  preferred_contact?: "phone" | "email";
}

// API response types
export interface CustomersResponse {
  customers: Customer[];
  total: number;
}

export interface SalesResponse {
  sales: SaleWithCustomer[];
  total: number;
}

export interface CreateCustomerResponse {
  message: string;
  customer: Customer;
}

export interface CreateSaleResponse {
  message: string;
  sale: Sale;
}

export interface UpdateCustomerResponse {
  message: string;
  customer: Customer;
}

export interface UpdateSaleResponse {
  message: string;
  sale: Sale;
}
