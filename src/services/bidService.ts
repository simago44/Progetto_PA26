import type { CreationAttributes, Transaction } from "sequelize";
import { Errors } from "../factory/errorFactory.ts";
import { type Auction } from "../models/Auction.ts";
import { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import bidRepository from "../repositories/bidRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import auctionService from "./auctionService.ts";
import { omit } from "lodash-es";
import userService from "./userService.ts";
import { AuctionType } from "../enums/enums.ts";
import sequelize from "../integrations/sequelize.ts";

class BidService {
  /**
   * Formats bids by removing unnecessary attributes.
   * @param bids The bids to format.
   * @returns A list of formatted bids.
   */
  public async formatBids(bids: Bid[]): Promise<Record<string, unknown>[]> {
    const formattedAuctions = await Promise.all(
      bids.map(async (bid) => {
        return omit(bid.dataValues, ["updatedAt"]);
      })
    );
    return formattedAuctions;
  }

  /**
   * Handles missing bid prices according to the auction type.
   * @param bid The bid creation attributes.
   * @param rawAuction The auction associated with the bid.
   * @param transaction Sequelize transaction to be used.
   * @returns The bid attributes with a valid bid price.
   * @throws {BidCantHavePriceError} If a Dutch auction bid contains a bid price.
   * @throws {BidMustHavePriceError} If a first-price or second-price auction bid does not contain a bid price.
   */
  public async handleBidPriceMissing(
    bid: Omit<CreationAttributes<Bid>, 'bidPrice'> & { bidPrice?: number | null; },
    rawAuction: Auction,
    transaction: Transaction | null = null
  ) {
    const auction = auctionService.toTypedAuction(rawAuction);
    switch (auction.type) {
      case AuctionType.English:
        if (bid.bidPrice == null) bid.bidPrice = await auctionService.getEnglishCurrentBidPrice(auction, transaction);
        break;
      case AuctionType.Dutch: {
        if (bid.bidPrice != null) throw new Errors.BidCantHavePriceError({ auctionType: auction.type });
        bid.bidPrice = auctionService.getDutchCurrentBidPrice(auction);
        break;
      }
      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice:
        if (bid.bidPrice == null) throw new Errors.BidMustHavePriceError({ auctionType: auction.type });
        break;
    }
    return bid as CreationAttributes<Bid>;
  }

  /**
   * Creates a new bid after validating the auction, user, and bid data.
   * @param bidData The bid creation attributes.
   * @returns The created Bid instance.
   * @throws {AuctionNotFoundError} If the auction does not exist.
   * @throws {UnauthorizedError} If the user does not exist or is not authorized to place the bid.
   * @throws {AuctionEndedError} If the auction has already ended.
   * @throws {BidTooLowError} If the bid price is below the minimum allowed price.
   * @throws {BidAlreadyPlacedError} If the user has already placed a bid in the auction.
   * @throws {InsufficientTokensError} If the user does not have enough tokens.
   */
  public async createBid(bidData: Omit<CreationAttributes<Bid>, 'bidPrice'> & { bidPrice?: number | null; }): Promise<Bid> {
    const auctionId: number = bidData.auctionId as number;
    const userId: string = bidData.userId;

    // We use transaction with UPDATE lock to prevent multiple bid creations simultaneously
    // and to prevent other queries relative to the auctionId/userId during the bid creation.
    return sequelize.transaction(async (t) => {
      const auction = await auctionRepository.findByPk(auctionId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

      const user = await userRepository.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
      // should not happen because we validated the JWT token. We throw a generic error
      if (!user) throw new Errors.UnauthorizedError();

      const data = await this.handleBidPriceMissing(bidData, auction, t);

      const bid: Bid = bidRepository.build(data);

      await this.checkIsBidValid(bid, auction, user, t);

      const createdBid = await bidRepository.save(bid, t);

      //If the auction is dutch must be closed when the first bid arrives
      if (auction.type == AuctionType.Dutch) await auctionService.closeAuction(auction.id, t);

      return createdBid;
    });
  }

  /**
   * Retrieves all bids for an auction and formats them.
   * @param auctionId The auction ID.
   * @returns A list of formatted bids.
   * @throws {AuctionNotFoundError} If the auction does not exist.
   * @throws {AuctionTypeNotSupportedError} If the auction type does not support bid retrieval.
   */
  public async getAuctionBids(auctionId: number): Promise<Record<string, unknown>[]> {
    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    if (auction.type != AuctionType.English && auction.type != AuctionType.Dutch) {
      throw new Errors.AuctionTypeNotSupportedError({ type: auction.type });
    }

    const bids = await bidRepository.findAuctionBids(auction.id);
    return this.formatBids(bids);
  }

  /**
   * Validates whether a bid can be placed on an auction.
   * @param bid The Bid instance to validate.
   * @param rawAuction The auction associated with the bid.
   * @param user The user placing the bid.
   * @param transaction Sequelize transaction to be used.
   * @throws {AuctionEndedError} If the auction has already ended.
   * @throws {BidTooLowError} If the bid price is below the minimum allowed price.
   * @throws {BidAlreadyPlacedError} If the user has already placed a bid in the auction.
   * @throws {InsufficientTokensError} If the user does not have enough tokens.
   */
  public async checkIsBidValid(bid: Bid, rawAuction: Auction, user: User, transaction: Transaction | null = null): Promise<void> {
    const auction = auctionService.toTypedAuction(rawAuction);
    const auctionEndsAt = await auctionService.getEndsAt(auction, transaction);
    if (auctionEndsAt <= new Date()) throw new Errors.AuctionEndedError();

    switch (auction.type) {
      case AuctionType.English: {
        const winningBid = await auctionService.getWinningBid(auction, transaction);

        // if no bid is found, we check that the bid is at least equal to the reservePrice
        // otherwise, we check if the bid is at least equal to winningBid + minimumIncrement
        if (!winningBid) {
          if (bid.bidPrice < auction.reservePrice) {
            throw new Errors.BidTooLowError({ minimumBid: auction.reservePrice });
          }
        } else {
          if (bid.bidPrice < winningBid.bidPrice + auction.minimumIncrement) {
            throw new Errors.BidTooLowError({ minimumBid: winningBid.bidPrice + auction.minimumIncrement });
          }
        }
        break;
      }

      case AuctionType.Dutch:
        break;

      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice: {
        const userHasBidsInAuction = await bidRepository.userHasBidsInAuction(auction.id, user.id, transaction);
        if (userHasBidsInAuction) throw new Errors.BidAlreadyPlacedError();
        break;
      }
    }

    const realUserTokens = await userService.getRealUserTokens(user, transaction);
    if (realUserTokens < bid.bidPrice) throw new Errors.InsufficientTokensError();
  }
}

const bidService = new BidService();

export default bidService;