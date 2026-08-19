import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.errors?.[0]?.message || 'Input validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.errors || error,
      });
    }
  };
};
