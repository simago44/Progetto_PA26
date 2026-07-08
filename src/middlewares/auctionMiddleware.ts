import type { NextFunction, Request, Response } from "express";
import { createZodError } from "../factory/errorFactory.ts";
import z from 'zod';
import { AuctionStatus, AuctionType } from "../enums/enums.ts";
import { AuctionConstants } from "../constants/constants.ts";
import { MINUTES } from "../utils/dateUtils.ts";

const BaseAuctionSchema = z.object({
  creatorId: z.string(),
  startsAt: z.coerce.date().refine((date) => date > new Date(), {
    message: "startsAt must be in the future",
  }),
  reservePrice: z.int().min(AuctionConstants.minReservePrice),
  type: z.enum(AuctionType),
  description: z.string().trim().min(AuctionConstants.descriptionMinLenght).max(AuctionConstants.descriptionMaxLenght)
});

const EnglishAuctionSchema = BaseAuctionSchema.extend({
  type: z.literal(AuctionType.English),
  endsAt: z.coerce.date(),
  minimumIncrement: z.int().min(1),
  delayBeforeEnding: z.int().min(0).default(AuctionConstants.defaultDelayBeforeEnding)
}).refine((data) => data.endsAt > data.startsAt, {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});

const DutchAuctionSchema = BaseAuctionSchema.extend({
  type: z.literal(AuctionType.Dutch),
  decrementPrice: z.int().min(1),
  decrementInterval: z.int().min(1 * MINUTES),
  startPrice: z.int().positive(),
}).refine((data) => data.startPrice > data.reservePrice, {
  message: "startPrice must be higher than the reservePrice",
  path: ["startPrice"],
});

const SealedAuctionSchema = BaseAuctionSchema.extend({
  type: z.enum([AuctionType.FirstPrice, AuctionType.SecondPrice]),
  endsAt: z.coerce.date(),
}).refine((data) => data.endsAt > data.startsAt, {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});

export const AuctionSchema = z.discriminatedUnion("type", [
  EnglishAuctionSchema,
  DutchAuctionSchema,
  SealedAuctionSchema,
]);

const getAuctionsSchema = z.object({
  creatorIds: z.array(z.string()).optional(),
  statuses: z.array(z.enum(AuctionStatus)).optional(),
  types: z.array(z.enum(AuctionType)).optional()
});

const getAuctionStatsSchema = z.object({
  types: z.array(z.enum(AuctionType)).optional(),
  startDate: z.coerce.date().optional().default(new Date(0)),
  endDate: z.coerce.date().optional(),
}).refine((data) => !data.endDate || data.endDate >= data.startDate, {
  message: "endDate must be after startDate",
  path: ["endDate"],
});

const updateReservePriceMiddleware = z.object({
  auctionId: z.coerce.number().nonnegative(),
  reservePrice: z.number().min(AuctionConstants.minReservePrice),
});

export function validateAuctionMiddleware(req: Request, res: Response, next: NextFunction) {
  const auction = req.body;
  auction.creatorId = res.locals.authId;

  const result = AuctionSchema.safeParse(auction);
  if (!result.success) throw createZodError(result.error, "validateAuctionMiddleware");

  res.locals.auction = result.data;

  next();
}

export function validateGetAuctionsMiddleware(req: Request, res: Response, next: NextFunction) {
  const data = req.query;
  if (typeof data.creatorIds === "string") data.creatorIds = data.creatorIds.split(',');
  if (typeof data.statuses === "string") data.statuses = data.statuses.split(',');
  if (typeof data.types === "string") data.types = data.types.split(',');

  const result = getAuctionsSchema.safeParse(data);
  if (!result.success) throw createZodError(result.error, "validateAuctionStatus");

  res.locals.filters = result.data;
  next();
}

export function validateUpdateReservePriceMiddleware(req: Request, res: Response, next: NextFunction) {
  const auctionId = req.params.auctionId;
  const reservePrice = req.body.reservePrice;

  const result = updateReservePriceMiddleware.safeParse({ auctionId, reservePrice });
  if (!result.success) throw createZodError(result.error, "validateUpdateReservePrice");

  res.locals.auctionId = result.data.auctionId;
  res.locals.reservePrice = result.data.reservePrice;
  next();
}

export function validateGetAuctionStatsMiddleware(req: Request, res: Response, next: NextFunction) {
  const data = req.query;
  if (typeof data.types === "string") data.types = data.types.split(',');

  const result = getAuctionStatsSchema.safeParse(data);
  if (!result.success) throw createZodError(result.error, "validateGetAuctionStats");

  res.locals.filters = result.data;
  next();
}