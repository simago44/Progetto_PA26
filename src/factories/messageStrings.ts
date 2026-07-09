/**
 * Message strings to be returned in the response body
 */

import type { AuctionType } from "../enums/enums.ts";

export const ErrorMessages = {
  MalformedPayload: "Bad Request - Malformed payload",
  UserNotFound: ({ userId, username }: { userId?: string, username?: string; }) => {
    if (userId) return `User with id '${userId}' not found`;
    if (username) return `User with username '${username}' not found`;
    return "User not found";
  },
  WalletNotFound: ({ userId, username }: { userId?: string, username?: string; }) => {
    if (userId) return `Wallet for user with id '${userId}' not found`;
    if (username) return `Wallet for user with username '${username}' not found`;
    return "Wallet for user not found";
  },
  Unauthorized: "Unauthorized",
  Forbidden: "Forbidden",
  InternalServer: "Internal server error",
  InvalidCredentials: "Invalid username or password",
  AuctionNotFound: ({ auctionId }: { auctionId: string | number; }) => `Auction with id '${auctionId}' not found`,
  FieldAlreadyUsed: ({ field, value }: { field: string, value: string; }) => `Field '${field}' with value '${value}' already used`,
  Validation: ({ form }: { form: string; }) => `Validation failed on ${form}`,
  AuctionEnded: ({ auctionId }: { auctionId: number; }) => `Auction with id ${auctionId} has already ended`,
  AuctionNotStarted: ({ auctionId }: { auctionId: number; }) => `Auction with id ${auctionId} has not started yet`,
  BidTooLow: ({ minimumBid }: { minimumBid: number; }) => `Bid must be at least ${minimumBid}`,
  BidAlreadyPlaced: "You have already placed a bid in this auction",
  AuctionTypeNotSupported: ({ type }: { type: AuctionType; }) => `This operation is not supported for ${type} auctions`,
  RouteNotFound: ({ path }: { path: string; }) => `Route on path '${path}' not found`,
  InsufficientTokens: "Insufficient tokens",
  AuctionHasAlreadyABid: "Auction has already a bid",
  BidCantHavePrice: ({ auctionType }: { auctionType: string; }) => `Bid for auction of type '${auctionType}' can't have bidPrice in request`,
  BidMustHavePrice: ({ auctionType }: { auctionType: string; }) => `Bid for auction of type '${auctionType}' must have bidPrice in request`
};

export const ErrorDetails = {
  Validation: ({ errors }: { errors: object; }) => errors,
  BidTooLow: ({ minimumBid }: { minimumBid: number; }) => ({ minimumBid })
};