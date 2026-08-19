import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode = 400, errorCode = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Determine status code and message
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.errorCode : 'INTERNAL_SERVER_ERROR';
  const message = statusCode === 500 ? 'An unexpected error occurred. Please try again.' : err.message;

  // Log detailed error privately on server console
  console.error(`[Error Handler] [${new Date().toISOString()}] ${req.method} ${req.path}:`);
  console.error(err);

  return res.status(statusCode).json({
    success: false,
    message,
    code: errorCode,
  });
};
