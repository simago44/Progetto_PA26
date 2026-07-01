import type { NextFunction, Request, Response } from "express";
import { AuctionStatus, AuctionType } from "../models/Auction.ts";
import { createZodError, Errors } from "../factory/errorFactory.ts";
import z from 'zod';

const BaseAuctionSchema = z.object({
  creatorId: z.string(),
  startAt: z.coerce.date().refine((date) => date > new Date(), {
    message: "startAt must be in the future",
  }),
  startPrice: z.int().min(1),
  type: z.enum(AuctionType),
});

const EnglishAuctionSchema = BaseAuctionSchema.extend({
  type: z.literal(AuctionType.English),
  endAt: z.coerce.date(),
  minimumIncrement: z.int().min(1),
  delayBeforeEnding: z.int().min(0)
}).refine((data) => data.endAt > data.startAt, {
  message: "endAt must be after startAt",
  path: ["endAt"],
});

const DutchAuctionSchema = BaseAuctionSchema.extend({
  type: z.literal(AuctionType.Dutch),
  decrementPrice: z.int().min(1),
  decrementInterval: z.int().min(60000),
  minimumPrice: z.int().positive().min(0),
});

const SealedAuctionSchema = BaseAuctionSchema.extend({
  type: z.enum([AuctionType.FirstPrice, AuctionType.SecondPrice]),
  endAt: z.coerce.date(),
}).refine((data) => data.endAt > data.startAt, {
  message: "endAt must be after startAt",
  path: ["endAt"],
});

const AuctionSchema = z.discriminatedUnion("type", [
  EnglishAuctionSchema,
  DutchAuctionSchema,
  SealedAuctionSchema,
]);

export async function validateAuctionMiddleware(req: Request, res: Response, next: NextFunction) {
  const auction = req.body;
  auction.creatorId = res.locals.authId;

  const result = AuctionSchema.safeParse(auction);

  if (!result.success) throw createZodError(result.error, "validateAuctionMiddleware");

  res.locals.auction = result.data;

  next();
}

const auctionStatusQuerySchema = z.object({
  creatorIds: z.array(z.string()).optional(),
  statuses: z.array(z.enum(AuctionStatus)).optional(),
  types: z.array(z.enum(AuctionType)).optional()
});

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