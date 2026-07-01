import type { Request, Response, NextFunction } from "express";
import { Errors, createZodError } from "../factory/errorFactory.ts";
import z from "zod";

const BidSchema = z.object({
  userId: z.string(),
  auctionId: z.string(),
  bidPrice: z.int().min(1)
})

/** Middleware which validates the bid in the request body */
export async function validateBidMiddleware(req: Request, res: Response, next: NextFunction) {
  req.body.userId = req.auth?.payload.sub;
  req.body.auctionId = req.params.auctionId;
  
  const result = BidSchema.safeParse(req.body);

  if (!result.success) throw createZodError(result.error, "validateBidMiddleware");

  // Overwrite req.body with the safely parsed/sanitized fields
  req.body = result.data;

  next();
}
