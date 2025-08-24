import { RequestHandler } from "express";

// Standardized response handler: wraps res.json payloads in { success, data }
export const responseHandler: RequestHandler = (req, res, next) => {
  res.ok = (data: any) => {
    res.json({ success: true, data });
  };
  res.fail = (status: number, error: any) => {
    res.status(status).json({ success: false, error });
  };
  return next();
};

export default responseHandler;
