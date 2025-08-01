import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validateRequest =
  (zodSchema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && req.body.data) {
        req.body = JSON.parse(req.body.data);
      }

      const validationData = {
        body: req.body,
        params: req.params,
        query: req.query,
      };

      const validated = (await zodSchema.parseAsync(
        validationData
      )) as typeof validationData;

      // Update request object with validated data
      if (validated.body) req.body = validated.body;
      if (validated.params) req.params = validated.params;
      if (validated.query) {
        // Cannot directly reassign req.query as it's read-only
        // Instead, merge the validated properties into the existing query object
        Object.assign(req.query, validated.query);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
