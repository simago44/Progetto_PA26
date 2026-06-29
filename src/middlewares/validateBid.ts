import type { Request, Response, NextFunction } from "express";
import { AppError, ErrorEnum, getErrorHTTPStatus, getErrorName } from "../factory/errorFactory.ts";
import z from "zod";
import { getZodErrorMessage } from "./validationMiddleware.ts";

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

  if (!result.success) {
    return next(new AppError(
      getErrorHTTPStatus(ErrorEnum.MalformedPayload),
      "Malformed bid: " + getZodErrorMessage(result),
      getErrorName(ErrorEnum.MalformedPayload)
    ));
  }

  // Overwrite req.body with the safely parsed/sanitized fields
  req.body = result.data;

  next();
}
