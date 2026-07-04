import z from "zod";
import type { Request, Response, NextFunction } from "express";
import { createZodError, Errors } from "../factory/errorFactory.ts";
import { AuctionType } from "../enums/enums.ts";

export function resolveUserIdParam(req: Request, res: Response, next: NextFunction) {
  if (!req.params.userId) throw new Errors.MalformedPayloadError();

  const userId = req.params.userId == "self" ? res.locals.authId : req.params.userId;
  res.locals.userId = userId;

  next();
};

export const topUpWalletSchema = z.object({
  tokens: z.number().positive()
});

export function validateTopUpWallet(req: Request, res: Response, next: NextFunction) {
  res.locals.userId = req.params.userId;
  const tokens = req.body.tokens;

  const result = topUpWalletSchema.safeParse({ tokens });
  if (!result.success) throw createZodError(result.error, "validateTopUpWallet");

  res.locals.tokens = result.data.tokens;

  next();
}

const auctionReportFiltersQuerySchema = z.object({
  won: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  types: z.array(z.enum(AuctionType)).optional(),
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
  if (typeof data.types === "string") data.types = data.types.split(',');
  
  const result = auctionReportFiltersQuerySchema.safeParse(data);
  if (!result.success) throw createZodError(result.error, "validateAuctionReportFilters");

  res.locals.filters = result.data;

  next();
}

const walletReportFiltersQuerySchema = z.object({
  startDate: z.coerce.date().optional().default(new Date(0)),
  endDate: z.coerce.date().optional().default(() => new Date()).refine(
    (date) => date <= new Date(),
    { message: "endDate cannot be in the future" }
  ),
}).refine((data) => data.endDate >= data.startDate, {
  message: "endDate must be after startDate",
  path: ["endDate"],
});

export function validateWalletReportFilters(req: Request, res: Response, next: NextFunction) {
  const data = req.query;
  
  const result = walletReportFiltersQuerySchema.safeParse(data);
  if (!result.success) throw createZodError(result.error, "validateWalletReportFilters");

  res.locals.filters = result.data;

  next();
}