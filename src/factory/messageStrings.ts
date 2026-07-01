/**
 * Message strings to be returned in the response body
 */

import type { AuctionType } from "../models/Auction.ts";

// Success
export const userCreatedSuccessfully_message: string =
  "User created successfully";
export const walletUpdatedSuccessfully_message: string =
  "Wallet updated successfully";

export const ErrorMessages = {
  MalformedPayload: "Bad Request - Malformed payload",
  UserNotFound: ({ userId }: { userId: string; }) => `User with id '${userId}' not found`,
  Unauthorized: "Unauthorized",
  Forbidden: "Forbidden",
  InternalServer: "Internal server error",
  WrongCredentials: "Wrong username or password",
  AuctionNotFound: ({ auctionId }: { auctionId: string; }) => `Auction with id '${auctionId}' not found`,
  InvalidAuctionStatus: ({ status }: { status: string | number; }) => `Auction status '${status}' not found`,
  FieldAlreadyUsed: ({ field, value }: { field: string, value: string; }) => `Field '${field}' with value '${value}' already used`,
  Validation: ({ form }: { form: string; }) => `Validation failed on ${form}`,
  AuctionEnded: "This auction has already ended",
  BidTooLow: ({ minimumBid }: { minimumBid: number; }) => `Bid must be at least ${minimumBid}`,
  BidAlreadyPlaced: "You have already placed a bid in this auction",
  AuctionTypeNotSupported: ({ type }: { type: AuctionType; }) => `This operation is not supported for ${type} auctions`,
  RouteNotFound: ({ path }: { path: string; }) => `Route on path '${path}' not found`,
};

export const ErrorDetails = {
  Validation: ({ errors }: { errors: Record<string, string[]>; }) => errors,
  BidTooLow: ({ minimumBid }: { minimumBid: number; }) => ({ minimumBid }),
  AuctionTypeNotSupported: ({ type }: { type: AuctionType; }) => ({ type }),
};