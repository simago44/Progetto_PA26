import z from "zod";
import type { Request, Response, NextFunction } from "express";
import { createZodError } from "../factories/errorFactory.ts";
import { AuctionStatus, AuctionType } from "../enums/enums.ts";
import { dateRangeSchema } from "./commonSchemas.ts";
import { getAuctionsSchema } from "./auctionMiddleware.ts";

export const topUpWalletSchema = z.object({
  userId: z.string(),
  tokens: z.int().positive()
});

const auctionReportFiltersSchema = getAuctionsSchema.extend({
  participantId: z.string(),
  won: z.enum(['true', 'false']).transform((val) => val === 'true').optional()
});

const walletReportFiltersSchema = dateRangeSchema.extend({
  participantId: z.string()
});

export function validateTopUpWallet(req: Request, res: Response, next: NextFunction) {
  const userId = req.params.userId;
  const tokens = req.body?.tokens;

  const result = topUpWalletSchema.safeParse({ userId, tokens });
  if (!result.success) throw createZodError(result.error, "validateTopUpWallet");

  res.locals.tokens = result.data.tokens;
  res.locals.userId = result.data.userId;

  next();
}

export function validateAuctionReportFilters(req: Request, res: Response, next: NextFunction) {
  const filters = req.query;
  filters.participantId = res.locals.userId;
  if (typeof filters.creatorIds === "string") filters.creatorIds = filters.creatorIds.split(',');
  if (typeof filters.statuses === "string") filters.statuses = filters.statuses.split(',');
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