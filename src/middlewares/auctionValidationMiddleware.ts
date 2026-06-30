import type { NextFunction, Request, Response } from "express";
import { AuctionType } from "../models/Auction.ts";
import { Errors, parseZodError } from "../factory/errorFactory.ts";
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

export async function validateAuctionMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.body.creatorId = req.auth?.payload.sub;
  const result = AuctionSchema.safeParse(req.body);

  if (!result.success) {
    throw new Errors.ValidationError({
      form: "validateAuctionMiddleware",
      errors: parseZodError(result.error),
    });
  }

  // Overwrite req.body with the safely parsed/sanitized fields
  req.body = result.data;

  next();
}