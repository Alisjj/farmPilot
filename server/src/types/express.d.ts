import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
      full_name: string;
    };
  }

  interface Response {
    ok: (data: any) => void;
    fail: (status: number, error: any) => void;
  }
}
