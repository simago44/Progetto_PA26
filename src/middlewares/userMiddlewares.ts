import z from "zod";
import type { Request, Response, NextFunction } from "express";
import { createZodError, Errors } from "../factory/errorFactory.ts";
import { AuctionType } from "../enums/enums.ts";

export const topUpWalletSchema = z.object({
  tokens: z.number().positive()
});

const auctionReportFiltersSchema = z.object({
  participantId: z.string(),
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

const walletReportFiltersSchema = z.object({
  startDate: z.coerce.date().optional().default(new Date(0)),
  endDate: z.coerce.date().optional().default(() => new Date()).refine(
    (date) => date <= new Date(),
    { message: "endDate cannot be in the future" }
  ),
}).refine((data) => data.endDate >= data.startDate, {
  message: "endDate must be after startDate",
  path: ["endDate"],
});


export function resolveUserIdParam(req: Request, res: Response, next: NextFunction) {
  if (!req.params.userId) throw new Errors.MalformedPayloadError();

  const userId = req.params.userId == "self" ? res.locals.authId : req.params.userId;
  res.locals.userId = userId;

  next();
};

export function validateTopUpWallet(req: Request, res: Response, next: NextFunction) {
  res.locals.userId = req.params.userId;
  const tokens = req.body.tokens;

  const result = topUpWalletSchema.safeParse({ tokens });
  if (!result.success) throw createZodError(result.error, "validateTopUpWallet");

  res.locals.tokens = result.data.tokens;

  next();
}

export function validateAuctionReportFilters(req: Request, res: Response, next: NextFunction) {
  const filters = req.query;
  filters.participantId = res.locals.userId;
  if (typeof filters.types === "string") filters.types = filters.types.split(',');

  const result = auctionReportFiltersSchema.safeParse(filters);
  if (!result.success) throw createZodError(result.error, "validateAuctionReportFilters");

  res.locals.filters = result.data;

  next();
}

export function validateWalletReportFilters(req: Request, res: Response, next: NextFunction) {
  const filters = req.query;
  filters.participantId = res.locals.userId;

  const result = walletReportFiltersSchema.safeParse(filters);
  if (!result.success) throw createZodError(result.error, "validateWalletReportFilters");

  res.locals.filters = result.data;

  next();
}