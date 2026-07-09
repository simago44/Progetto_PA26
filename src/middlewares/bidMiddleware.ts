import type { Request, Response, NextFunction } from "express";
import { createZodError } from "../factories/errorFactory.ts";
import z from "zod";
import { intIdSchema } from "./commonSchemas.ts";

const BidSchema = z.object({
  userId: z.string(),
  auctionId: intIdSchema,
  bidPrice: z.int().min(1).optional()
});

/** Middleware which validates the bid in the request body */
export function validateCreateBid(req: Request, res: Response, next: NextFunction) {
  const bid = {
    userId: res.locals.authId,
    auctionId: req.params.auctionId,
    bidPrice: req.body?.bidPrice
  };

  const result = BidSchema.safeParse(bid);
  if (!result.success) throw createZodError(result.error, "validateBidMiddleware");

  res.locals.bid = result.data;

  next();
}

const validateGetAuctionBidsSchema = z.object({
  auctionId: intIdSchema
})

export function validateGetAuctionBids(req: Request, res: Response, next: NextFunction) {
  const auctionId = req.params.auctionId;

  const result = validateGetAuctionBidsSchema.safeParse({ auctionId });
  if (!result.success) throw createZodError(result.error, "validateGetAuctionBids");

  res.locals.auctionId = result.data.auctionId;

  next();
}
