import * as repo from "../repositories/workAssignmentRepo";
import {
  WorkAssignmentCreateDTO,
  WorkAssignmentUpdateDTO,
} from "../types/dtos";

export const WorkAssignmentService = {
  async list(limit = 100, offset = 0) {
    return repo.listWorkAssignments(limit, offset);
  },

  async byDate(date: string) {
    return repo.findWorkAssignmentsByDate(date);
  },

  async create(payload: WorkAssignmentCreateDTO) {
    const dbRow: any = {
      work_date: payload.work_date,
      laborer_id: payload.laborer_id,
      tasks_assigned: payload.tasks_assigned || [],
      attendance_status: payload.attendance_status || "present",
      performance_notes: payload.performance_notes,
      supervisor_id: payload.supervisor_id,
    };
    const res = await repo.insertWorkAssignment(dbRow as any);
    return res[0];
  },

  async update(id: number, payload: WorkAssignmentUpdateDTO) {
    const dbRow: any = { ...payload };
    const res = await repo.updateWorkAssignment(id, dbRow as any);
    return res[0];
  },

  async remove(id: number) {
    const res = await repo.deleteWorkAssignment(id);
    return res[0];
  },
};
