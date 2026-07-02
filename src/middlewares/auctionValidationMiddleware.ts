import type { NextFunction, Request, Response } from "express";
import { createZodError } from "../factory/errorFactory.ts";
import z from 'zod';
import { AuctionStatus, AuctionType } from "../enums/enums.ts";
import { AuctionConstants } from "../constants/constants.ts";

const BaseAuctionSchema = z.object({
  creatorId: z.string(),
  startsAt: z.coerce.date().refine((date) => date > new Date(), {
    message: "startsAt must be in the future",
  }),
  startPrice: z.int().min(1),
  type: z.enum(AuctionType),
  description: z.string().trim().min(AuctionConstants.descriptionMinLenght).max(AuctionConstants.descriptionMaxLenght)
});

const EnglishAuctionSchema = BaseAuctionSchema.extend({
  type: z.literal(AuctionType.English),
  endsAt: z.coerce.date(),
  minimumIncrement: z.int().min(1),
  delayBeforeEnding: z.int().min(0).optional().default(AuctionConstants.defaultDelayBeforeEnding)
}).refine((data) => data.endsAt > data.startsAt, {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});

const DutchAuctionSchema = BaseAuctionSchema.extend({
  type: z.literal(AuctionType.Dutch),
  decrementPrice: z.int().min(1),
  decrementInterval: z.int().min(60000),
  minimumPrice: z.int().positive().min(0),
});

const SealedAuctionSchema = BaseAuctionSchema.extend({
  type: z.enum([AuctionType.FirstPrice, AuctionType.SecondPrice]),
  endsAt: z.coerce.date(),
}).refine((data) => data.endsAt > data.startsAt, {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});

const AuctionSchema = z.discriminatedUnion("type", [
  EnglishAuctionSchema,
  DutchAuctionSchema,
  SealedAuctionSchema,
]);

const auctionStatusQuerySchema = z.object({
  creatorIds: z.array(z.string()).optional(),
  statuses: z.array(z.enum(AuctionStatus)).optional(),
  types: z.array(z.enum(AuctionType)).optional()
});

const getAuctionStatsQuerySchema = z.object({
  type: z.enum(AuctionType),
  startDate: z.coerce.date().optional().default(new Date(0)),
  endDate: z.coerce.date().optional().default(() => new Date()).refine(
    (date) => date <= new Date(),
    { message: "endDate cannot be in the future" }
  ),
}).refine((data) => data.endDate >= data.startDate, {
  message: "endDate must be after startDate",
  path: ["endDate"],
});

export function validateAuctionMiddleware(req: Request, res: Response, next: NextFunction) {
  const auction = req.body;
  auction.creatorId = res.locals.authId;

  const result = AuctionSchema.safeParse(auction);
  if (!result.success) throw createZodError(result.error, "validateAuctionMiddleware");

  res.locals.auction = result.data;

  next();
}

export function validateAuctionStatusMiddleware(req: Request, res: Response, next: NextFunction) {
  let creatorIds = req.query.creatorIds;
  let statuses = req.query.statuses;
  let types = req.query.types;
  if (typeof creatorIds === "string") creatorIds = creatorIds.split(',');
  if (typeof statuses === "string") statuses = statuses.split(',');
  if (typeof types === "string") types = types.split(',');

  const result = auctionStatusQuerySchema.safeParse({ creatorIds, statuses, types });
  if (!result.success) throw createZodError(result.error, "validateAuctionStatus");

  res.locals = result.data;
  next();
}

export function validateGetAuctionStatsMiddleware(req: Request, res: Response, next: NextFunction) {
  const type = req.params.type;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const result = getAuctionStatsQuerySchema.safeParse({ type, startDate, endDate });
  if (!result.success) throw createZodError(result.error, "validateGetAuctionStats");

  res.locals = result.data;
  next();
}