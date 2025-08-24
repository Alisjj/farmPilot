export class ServiceError extends Error {
  public code: string;
  public status?: number;
  public details?: any;

  constructor(
    message: string,
    code = "SERVICE_ERROR",
    status?: number,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class BadRequestError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, "BAD_REQUEST", 400, details);
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, "NOT_FOUND", 404, details);
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, "CONFLICT", 409, details);
  }
}

export default {
  ServiceError,
  BadRequestError,
  NotFoundError,
  ConflictError,
};
