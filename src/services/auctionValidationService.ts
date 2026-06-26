import { z } from "zod";
import { ValidationError, ValidationErrorItem } from "sequelize";

import { AuctionType, type Auction } from "../models/Auction.ts";

const BaseAuctionSchema = z.object({
  type: z.enum(Object.values(AuctionType) as [string, ...string[]]),
  startAt: z.coerce.date().refine(date => date > new Date(), {
    message: "startAt must be in the future"
  }),
  startPrice: z.number().int().min(1),
});

const EnglishAuctionSchema = BaseAuctionSchema.extend({
  endAt: z.coerce.date(),
  minimumIncrement: z.number().int().min(1),
  delayBeforeEnding: z.number().int().min(0),
}).refine(data => data.endAt > data.startAt, {
  message: "endAt must be after startAt",
  path: ["endAt"]
});

const DutchAuctionSchema = BaseAuctionSchema.extend({
  decrementPrice: z.number().int().min(1),
  decrementInterval: z.number().int().min(60000),
  minimumPrice: z.number().int().min(0),
});

const SealedAuctionSchema = BaseAuctionSchema.extend({
  endAt: z.coerce.date()
}).refine(data => data.endAt > data.startAt, {
  message: "endAt must be after startAt",
  path: ["endAt"]
});

export const schemaMap = {
  [AuctionType.English]: EnglishAuctionSchema,
  [AuctionType.Dutch]: DutchAuctionSchema,
  [AuctionType.FirstPrice]: SealedAuctionSchema,
  [AuctionType.SecondPrice]: SealedAuctionSchema,
};

export function validateAuction(auction: Auction) {
  const schema = schemaMap[auction.type];
  const result = schema.safeParse(auction);

  if (!result.success) {
    throw new ValidationError(
      `${auction.type} auction type malformed`,
      result.error.issues.map(issue =>
        new ValidationErrorItem(
          issue.message, // message
          "validation error", //error type (accetta solo stringhe letterali di default)
          issue.path.join("."), //path
          String(issue.path[issue.path.length - 1]), //value
          auction, // instance which caused error
          "validate", //validator key
          "", //function Name
          [] //function Args
        )
      )
    );
  }
};