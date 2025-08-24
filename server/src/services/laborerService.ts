import * as repo from "../repositories/laborerRepo";
import { LaborerCreateDTO, LaborerUpdateDTO } from "../types/dtos";

export const LaborerService = {
  async list(limit = 100, offset = 0) {
    return repo.listLaborers(limit, offset);
  },

  async get(id: number) {
    const rows = await repo.findLaborerById(id);
    return rows[0] || null;
  },

  async create(payload: LaborerCreateDTO) {
    // map DTO to DB columns
    const dbRow: any = {
      employee_id: payload.employee_id,
      full_name: payload.full_name,
      phone: payload.phone,
      address: payload.address,
      position: payload.position || "general",
      monthly_salary: payload.monthly_salary,
      hire_date: payload.hire_date,
      is_active: payload.is_active !== false,
      emergency_contact: payload.emergency_contact,
      emergency_phone: payload.emergency_phone,
    };

    const res = await repo.insertLaborer(dbRow as any);
    return res[0];
  },

  async update(id: number, payload: LaborerUpdateDTO) {
    const dbRow: any = { ...payload };
    // ensure no unexpected fields
    delete (dbRow as any).first_name;
    delete (dbRow as any).last_name;
    const res = await repo.updateLaborer(id, dbRow as any);
    return res[0];
  },

  async remove(id: number) {
    const res = await repo.deleteLaborer(id);
    return res[0];
  },
};
