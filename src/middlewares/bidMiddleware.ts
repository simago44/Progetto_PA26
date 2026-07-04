import type { Request, Response, NextFunction } from "express";
import { createZodError } from "../factory/errorFactory.ts";
import z from "zod";

const BidSchema = z.object({
  userId: z.string(),
  auctionId: z.string(),
  bidPrice: z.int().min(1)
})

/** Middleware which validates the bid in the request body */
export async function validateBidMiddleware(req: Request, res: Response, next: NextFunction) {
  const bid = {
    userId: res.locals.authId,
    auctionId: req.params.auctionId,
    bidPrice: req.body.bidPrice
  }

  const result = BidSchema.safeParse(bid);
  if (!result.success) throw createZodError(result.error, "validateBidMiddleware");

  res.locals.bid = result.data;

  next();
}

export async function validateGetAuctionBids(req: Request, res: Response, next: NextFunction) {
  res.locals.auctionId = req.params.auctionId;

  next();
}
