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
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let errorCode = err instanceof AppError ? err.errorCode : 'INTERNAL_SERVER_ERROR';
  let message = statusCode === 500 ? 'An unexpected error occurred. Please try again.' : err.message;

  // Handle Prisma Known Request Errors
  if ('code' in err && typeof (err as any).code === 'string' && (err as any).code.startsWith('P')) {
    const prismaCode = (err as any).code;
    if (prismaCode === 'P2002') {
      statusCode = 409;
      errorCode = 'DUPLICATE_ENTRY';
      message = 'A record with this unique information already exists.';
    } else if (prismaCode === 'P2003') {
      statusCode = 400;
      errorCode = 'INVALID_REFERENCE';
      message = 'Invalid reference key or relationship ID provided.';
    } else if (prismaCode === 'P2025') {
      statusCode = 404;
      errorCode = 'RECORD_NOT_FOUND';
      message = 'The requested record was not found.';
    }
  }

  // Log detailed error privately on server console
  console.error(`[Error Handler] [${new Date().toISOString()}] ${req.method} ${req.path}:`);
  console.error(err);

  return res.status(statusCode).json({
    success: false,
    message,
    code: errorCode,
  });
};
