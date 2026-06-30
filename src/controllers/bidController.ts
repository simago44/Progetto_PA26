import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import bidRepository from "../repositories/bidRepository.ts";
import { Bid } from "../models/Bid.ts";
import { BaseError, ValidationError } from "sequelize";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";
import { getMsToEnd, getWinningBid } from "../models/AuctionUtils.ts";
import { Auction, AuctionType } from "../models/Auction.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import type { User } from "../models/User.ts";


async function isBidValid(bid: Bid, auction: Auction, user: User): Promise<string> {
  const auctionMsToEnd = await getMsToEnd(auction);
  if (auctionMsToEnd <= 0) return "Auction has ended";

  switch (auction.type) {
    case AuctionType.English:
      const winningBid = await getWinningBid(auction);
      if (!winningBid) return "";
      if (bid.bidPrice < winningBid?.finalPrice + auction.minimumIncrement) return "Bid value too low";
      return "";

    case AuctionType.Dutch:
      return "";

    case AuctionType.FirstPrice:
    case AuctionType.SecondPrice:
      const userHasBidsInAuction = await bidRepository.userHasBidsInAuction(auction.id, user.id);
      if (userHasBidsInAuction) return "Bid already placed";
      return "";
  }
}

export class BidController {
  public async createBid(req: Request, res: Response, next: NextFunction) {
    const auctionId = req.body.auctionId as string;
    const userId = req.body.userId as string;

    try {
      const auction = await auctionRepository.loadByPk(auctionId);
      const user = await userRepository.loadByPk(userId);

      // TODO: validation of bid based on auction and user (tokens, auction closed, ecc)
      const bid: Bid = Bid.build({ ...req.body });

      const errMsg = await isBidValid(bid, auction, user);
      if (errMsg != "") return next(createError(ErrorEnum.ValidationError, errMsg));

      const saved = await bidRepository.save(bid);

      res.status(StatusCodes.OK).json({ id: saved.id });
    } catch (err) {
      if (err instanceof ValidationError) {
        next(
          createError(
            ErrorEnum.ValidationError,
            `${err.message}: ${err.errors.map((e) => `${e.path}: ${e.message}`).join(`, `)}`,
          ),
        );
        return;
      }
      if (err instanceof BaseError) {
        next(createError(ErrorEnum.DatabaseError, err.message));
        return;
      }
      if (err instanceof Error) {
        next(createError(ErrorEnum.InternalServer, err.message));
        return;
      }
      next(createError(ErrorEnum.InternalServer));
    }
  }
  public async getAuctionBids(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ) {
    throw createError(ErrorEnum.RouteNotFound);
  }
}
