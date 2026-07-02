import z from "zod";
import type { Request, Response, NextFunction } from "express";
import { createZodError } from "../factory/errorFactory.ts";

const auctionReportFiltersQuerySchema = z.object({
  won: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  startDate: z.coerce.date().optional().default(new Date(0)),
  endDate: z.coerce.date().optional().default(() => new Date()).refine(
    (date) => date <= new Date(),
    { message: "endDate cannot be in the future" }
  ),
}).refine((data) => data.endDate >= data.startDate, {
  message: "endDate must be after startDate",
  path: ["endDate"],
});

export function validateAuctionReportFilters(req: Request, res: Response, next: NextFunction) {
  const data = req.query;
  const result = auctionReportFiltersQuerySchema.safeParse(data);
  if (!result.success) throw createZodError(result.error, "validateAuctionReportFilters");

  res.locals = result.data;

  next();
}